package com.admin.service;

import com.admin.dto.ChatMessageResponse;
import com.admin.entity.ChatMessage;
import com.admin.entity.ChatSession;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ChatMessageRepository;
import com.admin.repository.ChatSessionRepository;
import com.admin.repository.ProjectRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;

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

    public List<ChatMessage> getMessages(Long sessionId) {
        return messageRepo.findBySession_IdOrderByCreatedAtAsc(sessionId);
    }

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

        public ChatSession endSession(Long sessionId, String summary, Authentication authentication) {
                User actor = getAuthenticatedUser(authentication);
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

                if (session.getStartedBy() == null || session.getStartedBy().getId() == null
                                || !session.getStartedBy().getId().equals(actor.getId())) {
                        throw new AccessDeniedException("Only the session starter can end this chat.");
                }

        session.setEnded(true);
        session.setEndedAt(LocalDateTime.now());
        session.setSummary(summary);

        return sessionRepo.save(session);
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
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
                if (user.getRole() == Role.ADMIN) {
                        return;
                }

                if (project.getManager() != null && project.getManager().getId() != null
                                && project.getManager().getId().equals(user.getId())) {
                        return;
                }

                boolean isAssignee = project.getTasks() != null && project.getTasks().stream()
                                .anyMatch(task -> task.getAssignedTo() != null
                                                && task.getAssignedTo().getId() != null
                                                && task.getAssignedTo().getId().equals(user.getId()));

                if (!isAssignee) {
                        throw new AccessDeniedException("You are not a member of this project chat.");
                }
        }
}