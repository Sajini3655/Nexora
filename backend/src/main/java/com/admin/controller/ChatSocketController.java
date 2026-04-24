package com.admin.controller;

import com.admin.dto.ChatMessageRequest;
import com.admin.dto.ChatMessageResponse;
import com.admin.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageRequest request) {
        if (request.getSessionId() == null || request.getUserId() == null || request.getContent() == null) {
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