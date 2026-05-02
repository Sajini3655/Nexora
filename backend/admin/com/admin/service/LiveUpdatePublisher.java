package com.admin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class LiveUpdatePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishUsersChanged(String action) {
        publish("/topic/users", action, "users");
        publish("/topic/admin.dashboard", action, "users");
    }

    public void publishTicketsChanged(String action) {
        publish("/topic/tickets", action, "tickets");
        publish("/topic/admin.dashboard", action, "tickets");
        publish("/topic/client.dashboard", action, "tickets");
        publish("/topic/developer.dashboard", action, "tickets");
    }

    public void publishTasksChanged(String action) {
        publish("/topic/tasks", action, "tasks");
        publish("/topic/developer.dashboard", action, "tasks");
        publish("/topic/developer.workspace", action, "tasks");
        publish("/topic/client.dashboard", action, "tasks");
        publish("/topic/manager.dashboard", action, "tasks");
    }

    public void publishProjectsChanged(String action) {
        publish("/topic/projects", action, "projects");
        publish("/topic/manager.dashboard", action, "projects");
    }

    public void publishSystemHealthPulse() {
        publish("/topic/system-health", "pulse", "system-health");
        publish("/topic/admin.dashboard", "pulse", "system-health");
    }

    private void publish(String topic, String action, String entity) {
        Map<String, String> payload = new HashMap<>();
        payload.put("action", Objects.requireNonNullElse(action, "updated"));
        payload.put("entity", Objects.requireNonNullElse(entity, "unknown"));
        payload.put("timestamp", Instant.now().toString());

        messagingTemplate.convertAndSend(Objects.requireNonNull(topic), payload);
    }
}
