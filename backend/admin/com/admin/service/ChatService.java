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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatService {

    public record ChatSessionSummaryView(ChatSession session, long messageCount, String lastMessagePreview) {
    }

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;
    private final TaskRepository taskRepository;
    private final TicketRepository ticketRepository;
    private final SimpMessagingTemplate messagingTemplate;

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
            "database server down",
            "database server is down",
            "db down",
            "db server down",
            "server is down",
            "service is down",
            "ai service is down",
            "cannot proceed",
            "can't proceed",
            "system down",
            "backend down",
            "api down",
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

        if (!canAccessProjectChat(project, actor)) {
            throw new AccessDeniedException("You are not a member of this project chat.");
        }

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
    public ChatSession createSession(Long projectId, Authentication authentication) {
        User actor = getAuthenticatedUser(authentication);

        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!canAccessProjectChat(project, actor)) {
            throw new AccessDeniedException("You are not a member of this project chat.");
        }

        ChatSession session = ChatSession.builder()
                .project(project)
                .startedBy(actor)
                .startedAt(LocalDateTime.now())
                .ended(false)
                .build();

        return sessionRepo.save(session);
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long sessionId, Long userId, String content) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Ensure the user can access the chat for this project
        if (!canAccessProjectChat(session.getProject(), user)) {
            throw new AccessDeniedException("You are not a member of this project chat.");
        }

        if (session.getEnded() != null && session.getEnded()) {
            throw new IllegalStateException("Cannot send messages to an ended session.");
        }

        ChatMessage message = ChatMessage.builder()
            .session(session)
            .sender(user)
            .senderName(user.getName())
            .content(content)
            .createdAt(LocalDateTime.now())
            .build();

        ChatMessage saved = messageRepo.save(message);

        // Broadcast the message to all subscribed WebSocket clients
        ChatMessageResponse response = toResponse(saved);
        Long projectId = session.getProject().getId();
        String destination = String.format("/topic/projects/%d/sessions/%d/chat", projectId, sessionId);
        
        try {
            messagingTemplate.convertAndSend(destination, response);
        } catch (Exception e) {
            // Log the error but don't fail the save if broadcasting fails
            System.err.println("Error broadcasting message to " + destination + ": " + e.getMessage());
            e.printStackTrace();
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getMessages(Long sessionId) {
        return messageRepo.findBySession_IdOrderByCreatedAtAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public long getMessageCount(Long sessionId) {
        return messageRepo.countBySession_Id(sessionId);
    }

    @Transactional(readOnly = true)
    public String getLastMessagePreview(Long sessionId) {
        return messageRepo.findTopBySession_IdOrderByCreatedAtDesc(sessionId)
                .map(ChatMessage::getContent)
                .map(content -> {
                    if (content == null) {
                        return "";
                    }
                    if (content.length() > 100) {
                        return content.substring(0, 100) + "...";
                    }
                    return content;
                })
                .orElse("");
    }

    @Transactional(readOnly = true)
    public List<ChatSessionSummaryView> getAllProjectSessionsWithSummary(Long projectId, Authentication authentication) {
        List<ChatSession> sessions = getAllProjectSessions(projectId, authentication);
        if (sessions.isEmpty()) {
            return List.of();
        }

        List<Long> sessionIds = sessions.stream()
                .map(ChatSession::getId)
                .toList();

        Map<Long, Long> messageCounts = new HashMap<>();
        for (ChatMessageRepository.SessionMessageCountView row : messageRepo.countBySessionIds(sessionIds)) {
            messageCounts.put(row.getSessionId(), row.getMessageCount());
        }

        Map<Long, String> lastPreviews = new HashMap<>();
        for (ChatMessageRepository.SessionLastMessageView row : messageRepo.findLatestMessageBySessionIds(sessionIds)) {
            String content = row.getContent();
            if (content == null) {
                lastPreviews.put(row.getSessionId(), "");
            } else if (content.length() > 100) {
                lastPreviews.put(row.getSessionId(), content.substring(0, 100) + "...");
            } else {
                lastPreviews.put(row.getSessionId(), content);
            }
        }

        return sessions.stream()
                .map(session -> new ChatSessionSummaryView(
                        session,
                        messageCounts.getOrDefault(session.getId(), 0L),
                        lastPreviews.getOrDefault(session.getId(), "")
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessageResponses(Long sessionId, Authentication authentication) {
        User actor = getAuthenticatedUser(authentication);

        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!canAccessProjectChat(session.getProject(), actor)) {
            throw new AccessDeniedException("You are not a member of this project chat.");
        }

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

        if (session.getStartedBy() == null || session.getStartedBy().getId() == null
                || !session.getStartedBy().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the chat starter can end this session.");
        }

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
        int start = Math.max(0, messages.size() - count);

        for (int i = start; i < messages.size(); i++) {
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

        User assignee = project.getManager() != null ? project.getManager() : actor;

        Ticket ticket = Ticket.builder()
                .title(ticketTitle)
                .description(description.toString())
                .status("OPEN")
                .priority("HIGH")
                .createdBy(actor)
            .assignedTo(assignee)
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

    @Transactional(readOnly = true)
    public ChatSession getSessionForUser(Long sessionId, Authentication authentication) {
        User actor = getAuthenticatedUser(authentication);

        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!canAccessProjectChat(session.getProject(), actor)) {
            throw new AccessDeniedException("You are not a member of this project chat.");
        }

        return session;
    }

    @Transactional(readOnly = true)
    public ChatSession getProjectSession(Long projectId, Authentication authentication) {
        User actor = getAuthenticatedUser(authentication);

        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!canAccessProjectChat(project, actor)) {
            throw new AccessDeniedException("You are not a member of this project chat.");
        }

        return sessionRepo.findFirstByProject_IdAndEndedFalseOrderByStartedAtDesc(projectId)
                .orElse(null);
    }

    /**
     * Check whether a given user should be allowed to access project chat features.
     * Does not throw; returns true/false so callers can decide how to respond.
     */
    public boolean canAccessProjectChat(Project project, User user) {
        if (project == null || user == null) {
            return false;
        }

        if (user.getRole() == Role.ADMIN || user.getAllRoles().contains(Role.ADMIN)) {
            return true;
        }

        if (project.getManager() != null
                && project.getManager().getId() != null
                && project.getManager().getId().equals(user.getId())) {
            return true;
        }

        return taskRepository.existsByProject_IdAndAssignedTo_Id(project.getId(), user.getId());
    }

    public boolean canEndChat(ChatSession session, User user) {
        if (session == null || user == null) return false;

        if (session.getStartedBy() == null || session.getStartedBy().getId() == null) return false;

        return session.getStartedBy().getId().equals(user.getId());
    }

    @Transactional(readOnly = true)
    public List<ChatSession> getAllProjectSessions(Long projectId, Authentication authentication) {
        User actor = getAuthenticatedUser(authentication);

        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!canAccessProjectChat(project, actor)) {
            throw new AccessDeniedException("You are not a member of this project chat.");
        }

        return sessionRepo.findByProject_IdOrderByStartedAtDesc(projectId);
    }

    @Transactional(readOnly = true)
    public List<ChatSession> getActiveProjectSessions(Long projectId, Authentication authentication) {
        User actor = getAuthenticatedUser(authentication);

        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!canAccessProjectChat(project, actor)) {
            throw new AccessDeniedException("You are not a member of this project chat.");
        }

        return sessionRepo.findByProject_IdAndEndedFalseOrderByStartedAtDesc(projectId);
    }
}
