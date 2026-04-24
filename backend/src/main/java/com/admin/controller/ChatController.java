package com.admin.controller;

import com.admin.dto.ChatMessageResponse;
import com.admin.entity.ChatSession;
import com.admin.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
    public Map<String, Object> start(@PathVariable Long projectId) {
        ChatSession session = chatService.startSession(projectId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", session.getId());
        response.put("projectId", session.getProject().getId());
        response.put("startedAt", session.getStartedAt());
        response.put("ended", session.getEnded() != null ? session.getEnded() : false);
        response.put("summary", session.getSummary());

        return response;
    }

    @GetMapping("/messages/{sessionId}")
    public List<ChatMessageResponse> getMessages(@PathVariable Long sessionId) {
        return chatService.getMessageResponses(sessionId);
    }

    @PostMapping("/end/{sessionId}")
    public Map<String, Object> end(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> body
    ) {
        String summary = body.get("summary");
        ChatSession session = chatService.endSession(sessionId, summary);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", session.getId());
        response.put("projectId", session.getProject().getId());
        response.put("startedAt", session.getStartedAt());
        response.put("endedAt", session.getEndedAt());
        response.put("ended", session.getEnded() != null ? session.getEnded() : false);
        response.put("summary", session.getSummary());

        return response;
    }
}