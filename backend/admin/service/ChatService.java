package com.admin.service;

import com.admin.dto.ChatMessageResponse;
import com.admin.entity.ChatMessage;
import com.admin.entity.ChatSession;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.Ticket;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ChatMessageRepository;
import com.admin.repository.ChatSessionRepository;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;
    private final TaskRepository taskRepository;
    private final TicketRepository ticketRepository;

    private static final Set<String> BLOCKER_KEYWORDS = Set.of(
            "blocked",
            "blocker",
            "blocking",
            "cannot continue",
            "can't continue",
            "stuck",
            "urgent",
            "critical",
            "production down",
            "server down",
            "database down",
            "login broken",
            "not working",
            "crash",
            "error",
            "failed",
            "failing",
            "bug",
            "issue",
            "500"
    );

    @Transactional
    public ChatSession startSession(Long projectId, Authentication authentication) {
        User actor = getAuthenticatedUser(authentication);

        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        ensureCanAccessProject(project, actor);

        return sessionRepo.findFirstByProject_IdAndEndedFalseOrderByStartedAtDesc(projectId)
                .orElseGet(() -> {
                    ChatSession session = ChatSession.builder()
                            .project(project)
                            .startedBy(actor)
                            .startedAt(LocalDateTime.now())
                            .ended(false)
                            .build();

                    return sessionRepo.save(session);
                });
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long sessionId, Long userId, String content) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ensureCanAccessProject(session.getProject(), user);

        ChatMessage message = ChatMessage.builder()
                .session(session)
                .sender(user)
                .senderName(user.getName())
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = messageRepo.save(message);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getMessages(Long sessionId) {
        return messageRepo.findBySession_IdOrderByCreatedAtAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessageResponses(Long sessionId, Authentication authentication) {
        User actor = getAuthenticatedUser(authentication);

        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        ensureCanAccessProject(session.getProject(), actor);

        return messageRepo.findBySession_IdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ChatSession endSession(Long sessionId, String summary, Authentication authentication) {
        User actor = getAuthenticatedUser(authentication);

        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        List<ChatMessage> messages = messageRepo.findBySession_IdOrderByCreatedAtAsc(sessionId);

        String finalSummary = buildFinalSummary(summary, messages);
        boolean hasBlocker = containsBlocker(messages);

        session.setEnded(true);
        session.setEndedAt(LocalDateTime.now());
        session.setSummary(finalSummary);

        ChatSession savedSession = sessionRepo.save(session);

        if (hasBlocker) {
            createBlockerTicketIfNeeded(savedSession, actor, messages, finalSummary);
        }

        return savedSession;
    }

    private String buildFinalSummary(String frontendSummary, List<ChatMessage> messages) {
        if (frontendSummary != null && !frontendSummary.isBlank()
                && !frontendSummary.toLowerCase(Locale.ROOT).contains("error generating summary")) {
            return frontendSummary.trim();
        }

        if (messages == null || messages.isEmpty()) {
            return "Chat ended. No messages were available to summarize.";
        }

        StringBuilder summary = new StringBuilder();
        summary.append("Chat Summary:\n");

        int count = Math.min(messages.size(), 6);

        for (int i = 0; i < count; i++) {
            ChatMessage message = messages.get(i);
            String sender = message.getSenderName() == null || message.getSenderName().isBlank()
                    ? "User"
                    : message.getSenderName();

            String content = message.getContent() == null ? "" : message.getContent().trim();

            if (content.length() > 180) {
                content = content.substring(0, 180) + "...";
            }

            summary.append("- ")
                    .append(sender)
                    .append(": ")
                    .append(content)
                    .append("\n");
        }

        if (messages.size() > count) {
            summary.append("- Additional messages were discussed in the chat.\n");
        }

        if (containsBlocker(messages)) {
            summary.append("\nBlocker/Risk Detected: The chat contains issue or blocker-related keywords.");
        } else {
            summary.append("\nNo major blocker detected from keywords.");
        }

        return summary.toString();
    }

    private boolean containsBlocker(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return false;
        }

        StringBuilder allText = new StringBuilder();

        for (ChatMessage message : messages) {
            if (message.getContent() != null) {
                allText.append(message.getContent()).append(" ");
            }
        }

        String text = allText.toString().toLowerCase(Locale.ROOT);

        for (String keyword : BLOCKER_KEYWORDS) {
            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private void createBlockerTicketIfNeeded(
            ChatSession session,
            User actor,
            List<ChatMessage> messages,
            String summary
    ) {
        Project project = session.getProject();

        if (project == null) {
            return;
        }

        String ticketTitle = "Chat Blocker Detected - " + safeProjectName(project);

        StringBuilder description = new StringBuilder();
        description.append(summary == null ? "A blocker was detected in project chat." : summary);
        description.append("\n\n---\n");
        description.append("Source: CHAT");
        description.append("\nChat Session ID: ").append(session.getId());
        description.append("\nProject: ").append(safeProjectName(project));

        if (messages != null && !messages.isEmpty()) {
            description.append("\n\nRecent Chat Messages:\n");

            int start = Math.max(0, messages.size() - 5);

            for (int i = start; i < messages.size(); i++) {
                ChatMessage message = messages.get(i);
                description.append("- ")
                        .append(message.getSenderName() == null ? "User" : message.getSenderName())
                        .append(": ")
                        .append(message.getContent() == null ? "" : message.getContent())
                        .append("\n");
            }
        }

        Ticket ticket = Ticket.builder()
                .title(ticketTitle)
                .description(description.toString())
                .status("OPEN")
                .priority("HIGH")
                .createdBy(actor)
                .assignedTo(project.getManager())
                .project(project)
                .sourceChannel("CHAT")
                .sourceSubject("Chat blocker detected")
                .build();

        ticketRepository.save(ticket);
    }

    private String safeProjectName(Project project) {
        if (project == null || project.getName() == null || project.getName().isBlank()) {
            return "Project";
        }

        return project.getName();
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .sessionId(message.getSession() != null ? message.getSession().getId() : null)
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSenderName())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }

        return userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private void ensureCanAccessProject(Project project, User user) {
        if (project == null) {
            throw new ResourceNotFoundException("Project not found");
        }

        if (user == null) {
            throw new AccessDeniedException("Authentication required");
        }

        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (project.getManager() != null
                && project.getManager().getId() != null
                && project.getManager().getId().equals(user.getId())) {
            return;
        }

        boolean isAssignee = taskRepository.existsByProject_IdAndAssignedTo_Id(
                project.getId(),
                user.getId()
        );

        if (!isAssignee) {
            throw new AccessDeniedException("You are not a member of this project chat.");
        }
    }

    @Transactional(readOnly = true)
    public ChatSession getSession(Long sessionId) {
        return sessionRepo.findById(sessionId).orElse(null);
    }
}