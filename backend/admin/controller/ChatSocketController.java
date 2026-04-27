package com.admin.controller;

import com.admin.dto.ChatMessageRequest;
import com.admin.dto.ChatMessageResponse;
import com.admin.service.ChatService;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageRequest request, Principal principal) {
        if (request.getSessionId() == null || request.getUserId() == null || request.getContent() == null) {
            return;
        }

        if (principal == null || principal.getName() == null) {
            return;
        }

        var authUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (authUser == null || authUser.getId() == null || !authUser.getId().equals(request.getUserId())) {
            return;
        }

        String trimmed = request.getContent().trim();
        if (trimmed.isEmpty()) {
            return;
        }

        ChatMessageResponse response = chatService.sendMessage(
                request.getSessionId(),
                request.getUserId(),
                trimmed
        );

        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getSessionId(),
                response
        );
    }
}