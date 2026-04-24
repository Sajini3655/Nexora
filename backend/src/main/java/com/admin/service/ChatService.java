package com.admin.service;

import com.admin.dto.ChatMessageResponse;
import com.admin.entity.ChatMessage;
import com.admin.entity.ChatSession;
import com.admin.entity.Project;
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

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;

    public ChatSession startSession(Long projectId) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        return sessionRepo.findFirstByProject_IdAndEndedFalseOrderByStartedAtDesc(projectId)
                .orElseGet(() -> {
                    ChatSession session = ChatSession.builder()
                            .project(project)
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

    public List<ChatMessageResponse> getMessageResponses(Long sessionId) {
        return messageRepo.findBySession_IdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ChatSession endSession(Long sessionId, String summary) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

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
}