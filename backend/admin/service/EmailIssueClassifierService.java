package com.admin.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailIssueClassifierService {

    @Value("${app.ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public ClassificationResult classify(String subject, String body) {
        try {
            String message = "Subject: " + safe(subject) + "\nBody: " + safe(body);

            Map<String, Object> msg = new HashMap<>();
            msg.put("user", "user");
            msg.put("message", message);

            Map<String, Object> payload = new HashMap<>();
            payload.put("messages", List.of(msg));
            payload.put("create_tickets", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceBaseUrl + "/chat/end",
                    request,
                    Map.class
            );

            Map<?, ?> bodyMap = response.getBody();
            if (bodyMap == null) {
                return ClassificationResult.unknown("AI classifier returned empty response");
            }

            List<String> blockers = toStringList(bodyMap.get("blockers"));
            boolean ticketPromptNeeded = asBoolean(bodyMap.get("ticket_prompt_needed"));

            if (!blockers.isEmpty() || ticketPromptNeeded) {
                return ClassificationResult.issue(blockers, "AI detected issue/blocker");
            }

            return ClassificationResult.notIssue("AI found no blockers/issues");
        } catch (Exception ex) {
            return ClassificationResult.unknown("AI classifier unavailable: " + ex.getMessage());
        }
    }

    private static List<String> toStringList(Object value) {
        List<String> result = new ArrayList<>();
        if (!(value instanceof List<?> list)) {
            return result;
        }

        for (Object item : list) {
            if (item != null) {
                String str = item.toString().trim();
                if (!str.isEmpty()) {
                    result.add(str);
                }
            }
        }

        return result;
    }

    private static boolean asBoolean(Object value) {
        if (value instanceof Boolean boolVal) {
            return boolVal;
        }
        if (value instanceof String strVal) {
            return "true".equalsIgnoreCase(strVal.trim());
        }
        return false;
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    @Getter
    @AllArgsConstructor
    public static class ClassificationResult {
        private final boolean issue;
        private final boolean unknown;
        private final List<String> blockers;
        private final String reason;

        public static ClassificationResult issue(List<String> blockers, String reason) {
            return new ClassificationResult(true, false, blockers == null ? List.of() : blockers, reason);
        }

        public static ClassificationResult notIssue(String reason) {
            return new ClassificationResult(false, false, List.of(), reason);
        }

        public static ClassificationResult unknown(String reason) {
            return new ClassificationResult(false, true, List.of(), reason);
        }
    }
}