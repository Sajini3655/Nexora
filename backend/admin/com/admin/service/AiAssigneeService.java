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

import java.util.*;

@Service
public class AiAssigneeService {

    @Value("${app.ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public RecommendResult recommend(String title, String description, List<Map<String, Object>> candidates) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("title", title != null ? title : "");
            payload.put("description", description != null ? description : "");
            payload.put("candidates", candidates);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceBaseUrl + "/assign/recommend",
                    request,
                    Map.class
            );

            Map<?, ?> bodyMap = response.getBody();
            if (bodyMap == null) {
                return new RecommendResult(null, null, "No response from AI service", Collections.<String>emptyList(), 0.0, false);
            }

            String email = (String) bodyMap.get("recommendedEmail");
            String name = (String) bodyMap.get("recommendedName");
            String explanation = (String) bodyMap.get("explanation");
            List<String> matched = new ArrayList<>();
            Object matchedObj = bodyMap.get("matchedSkills");
            if (matchedObj instanceof List<?>) {
                for (Object o : (List<?>) matchedObj) {
                    if (o != null) matched.add(String.valueOf(o));
                }
            }
            double confidence = 0.0;
            Object confObj = bodyMap.get("confidence");
            if (confObj instanceof Number) confidence = ((Number) confObj).doubleValue();

            return new RecommendResult(email, name, explanation, matched, confidence, true);
        } catch (Exception ex) {
            return new RecommendResult(null, null, "AI service error: " + ex.getMessage(), Collections.<String>emptyList(), 0.0, false);
        }
    }

    @AllArgsConstructor
    @Getter
    public static class RecommendResult {
        private final String recommendedEmail;
        private final String recommendedName;
        private final String explanation;
        private final List<String> matchedSkills;
        private final double confidence;
        private final boolean usedAi;
    }
}
