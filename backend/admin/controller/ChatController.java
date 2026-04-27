package com.admin.controller;

import com.admin.dto.ChatMessageResponse;
import com.admin.entity.ChatSession;
import com.admin.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/start/{projectId}")
    public Map<String, Object> start(@PathVariable Long projectId, Authentication authentication) {
        ChatSession session = chatService.startSession(projectId, authentication);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", session.getId());
        response.put("projectId", session.getProject().getId());
        response.put("startedById", session.getStartedBy() == null ? null : session.getStartedBy().getId());
        response.put("startedAt", session.getStartedAt());
        response.put("ended", session.getEnded() != null ? session.getEnded() : false);
        response.put("summary", session.getSummary());

        return response;
    }

    @GetMapping("/messages/{sessionId}")
    public List<ChatMessageResponse> getMessages(@PathVariable Long sessionId, Authentication authentication) {
        return chatService.getMessageResponses(sessionId, authentication);
    }

    @PostMapping("/end/{sessionId}")
    public Map<String, Object> end(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String summary = body.get("summary");
        ChatSession session = chatService.endSession(sessionId, summary, authentication);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", session.getId());
        response.put("projectId", session.getProject().getId());
        response.put("startedById", session.getStartedBy() == null ? null : session.getStartedBy().getId());
        response.put("startedAt", session.getStartedAt());
        response.put("endedAt", session.getEndedAt());
        response.put("ended", session.getEnded() != null ? session.getEnded() : false);
        response.put("summary", session.getSummary());

        return response;
    }
}