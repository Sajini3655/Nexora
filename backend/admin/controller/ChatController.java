package com.admin.controller;

import com.admin.dto.ChatMessageResponse;
import com.admin.entity.ChatSession;
import com.admin.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;
import java.lang.reflect.Method;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/project/{projectId}")
    public Map<String, Object> getProjectSession(@PathVariable Long projectId, Authentication authentication) {
        ChatSession session = chatService.getProjectSession(projectId, authentication);
        
        if (session == null) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", null);
            response.put("projectId", projectId);
            response.put("ended", true);
            response.put("message", "No active chat session for this project");
            return response;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", session.getId());
        response.put("projectId", session.getProject().getId());
        response.put("startedById", session.getStartedBy() == null ? null : session.getStartedBy().getId());
        response.put("startedAt", session.getStartedAt());
        response.put("ended", session.getEnded() != null ? session.getEnded() : false);
        response.put("summary", session.getSummary());

        return response;
    }

    // New session-centric endpoints
    @GetMapping("/project/{projectId}/sessions")
    public List<Map<String, Object>> listProjectSessions(@PathVariable Long projectId, Authentication authentication) {
        List<ChatSession> sessions;

        try {
            sessions = chatService.getAllProjectSessions(projectId, authentication);
        } catch (AccessDeniedException ex) {
            return List.of();
        }
        
        return sessions.stream()
            .map(this::buildSessionResponse)
            .toList();
    }

    @PostMapping("/project/{projectId}/sessions")
    public Map<String, Object> createProjectSession(@PathVariable Long projectId, Authentication authentication) {
        ChatSession session = chatService.createSession(projectId, authentication);
        return buildSessionResponse(session);
    }

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

    @GetMapping("/sessions/{sessionId}")
    public Map<String, Object> getSession(@PathVariable Long sessionId, Authentication authentication) {
        ChatSession session = chatService.getSession(sessionId);
        
        if (session == null) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", null);
            response.put("error", "Session not found");
            return response;
        }

        return buildSessionResponse(session);
    }

    @GetMapping("/messages/{sessionId}")
    public List<ChatMessageResponse> getMessages(@PathVariable Long sessionId, Authentication authentication) {
        return chatService.getMessageResponses(sessionId, authentication);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public List<ChatMessageResponse> getMessagesForSession(@PathVariable Long sessionId, Authentication authentication) {
        return chatService.getMessageResponses(sessionId, authentication);
    }

    @PostMapping("/messages")
    public ChatMessageResponse sendMessage(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        // Basic validation
        Object sessionObj = body.get("sessionId");
        Object contentObj = body.get("content");
        if (sessionObj == null || contentObj == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "`sessionId` and `content` are required");
        }

        Long sessionId;
        try {
            if (sessionObj instanceof Number) {
                sessionId = ((Number) sessionObj).longValue();
            } else {
                sessionId = Long.parseLong(sessionObj.toString());
            }
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sessionId");
        }

        String content = contentObj.toString();

        // Ensure authenticated
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        Object principal = authentication.getPrincipal();
        Long userId = null;

        // Try common principal shapes: custom principal with getId()/getUserId(), UserDetails, or numeric name
        try {
            // Try getId()
            try {
                Method m = principal.getClass().getMethod("getId");
                Object val = m.invoke(principal);
                if (val instanceof Number) userId = ((Number) val).longValue();
                else userId = Long.parseLong(val.toString());
            } catch (NoSuchMethodException ignore) {
                // try getUserId()
                try {
                    Method m2 = principal.getClass().getMethod("getUserId");
                    Object val = m2.invoke(principal);
                    if (val instanceof Number) userId = ((Number) val).longValue();
                    else userId = Long.parseLong(val.toString());
                } catch (NoSuchMethodException ignore2) {
                    // fallback to UserDetails or authentication name
                    if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                        String username = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
                        userId = Long.parseLong(username);
                    } else {
                        // try authentication.getName()
                        String name = authentication.getName();
                        try {
                            userId = Long.parseLong(name);
                        } catch (NumberFormatException nfe) {
                            // lastly try principal.toString()
                            userId = Long.parseLong(principal.toString());
                        }
                    }
                }
            }
        } catch (NumberFormatException nfe) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to resolve numeric user id from authentication principal");
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error resolving user id from authentication principal");
        }

        return chatService.sendMessage(sessionId, userId, content);
    }

    @GetMapping("/project/{projectId}/messages")
    public List<ChatMessageResponse> getProjectMessages(@PathVariable Long projectId, Authentication authentication) {
        var session = chatService.getProjectSession(projectId, authentication);
        if (session == null || session.getId() == null) {
            return List.of();
        }

        var messages = chatService.getMessageResponses(session.getId(), authentication);
        System.out.println("ChatController: getProjectMessages projectId=" + projectId + " sessionId=" + session.getId() + " messages=" + (messages == null ? 0 : messages.size()));
        return messages;
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

    @PostMapping("/sessions/{sessionId}/end")
    public Map<String, Object> endSession(@PathVariable Long sessionId, @RequestBody Map<String, String> body, Authentication authentication) {
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

    private Map<String, Object> buildSessionResponse(ChatSession session) {
        long messageCount = chatService.getMessageCount(session.getId());
        String lastMessagePreview = chatService.getLastMessagePreview(session.getId());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", session.getId());
        response.put("projectId", session.getProject().getId());
        response.put("startedById", session.getStartedBy() == null ? null : session.getStartedBy().getId());
        response.put("startedByName", session.getStartedBy() == null ? "Unknown" : session.getStartedBy().getName());
        response.put("startedAt", session.getStartedAt());
        response.put("endedAt", session.getEndedAt());
        response.put("ended", session.getEnded() != null ? session.getEnded() : false);
        response.put("summary", session.getSummary());
        response.put("messageCount", messageCount);
        response.put("lastMessagePreview", lastMessagePreview);
        
        return response;
    }
}