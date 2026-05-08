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
public class AiSkillExtractionService {

    @Value("${app.ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Extract required skills from task using Groq AI.
     * Falls back to keyword extraction if AI service is unavailable.
     */
    public SkillExtractionResult extract(String title, String description) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("title", title != null ? title : "");
            payload.put("description", description != null ? description : "");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceBaseUrl + "/skill/extract",
                    request,
                    Map.class
            );

            Map<?, ?> bodyMap = response.getBody();
            if (bodyMap == null) {
                return fallbackExtraction(title, description);
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> skillsList = (List<Map<String, Object>>) bodyMap.get("skills");
            String explanation = (String) bodyMap.get("explanation");

            List<SkillWeight> skills = new ArrayList<>();
            if (skillsList != null) {
                for (Map<String, Object> skillMap : skillsList) {
                    String skillName = (String) skillMap.get("name");
                    Object weightObj = skillMap.get("weight");
                    double weight = 0.0;
                    
                    if (weightObj instanceof Number) {
                        weight = ((Number) weightObj).doubleValue();
                    }
                    
                    if (skillName != null && !skillName.isEmpty() && weight > 0) {
                        skills.add(new SkillWeight(skillName, weight));
                    }
                }
            }

            if (skills.isEmpty()) {
                skills.add(new SkillWeight("General", 1.0));
            }

            return new SkillExtractionResult(skills, explanation, true);
        } catch (Exception ex) {
            return fallbackExtraction(title, description);
        }
    }

    /**
     * Fallback to keyword-based skill extraction when AI service is unavailable.
     */
    private SkillExtractionResult fallbackExtraction(String title, String description) {
        Map<String, List<String>> keywords = new LinkedHashMap<>();
        keywords.put("React", Arrays.asList("react", "jsx", "component", "frontend", "ui"));
        keywords.put("Node.js", Arrays.asList("node", "express", "api", "backend", "jwt", "auth"));
        keywords.put("Database", Arrays.asList("database", "sql", "schema", "query", "postgres", "mysql", "h2"));
        keywords.put("UI Design", Arrays.asList("figma", "ux", "design", "wireframe", "layout"));
        keywords.put("Spring Boot", Arrays.asList("spring", "springboot", "java", "controller", "service"));
        keywords.put("Testing", Arrays.asList("test", "testing", "junit", "jest", "bug", "bugfix"));
        keywords.put("DevOps", Arrays.asList("docker", "deploy", "pipeline", "ci", "cd"));
        keywords.put("Python", Arrays.asList("python", "django", "flask", "fastapi"));

        String text = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase();

        Map<String, Integer> hits = new LinkedHashMap<>();
        int totalHits = 0;
        
        for (Map.Entry<String, List<String>> entry : keywords.entrySet()) {
            int count = 0;
            for (String keyword : entry.getValue()) {
                if (text.contains(keyword)) {
                    count++;
                }
            }
            if (count > 0) {
                hits.put(entry.getKey(), count);
                totalHits += count;
            }
        }

        List<SkillWeight> skills = new ArrayList<>();
        if (hits.isEmpty()) {
            skills.add(new SkillWeight("General", 1.0));
        } else {
            for (Map.Entry<String, Integer> entry : hits.entrySet()) {
                double weight = entry.getValue() / (double) totalHits;
                skills.add(new SkillWeight(entry.getKey(), weight));
            }
        }

        return new SkillExtractionResult(skills, "Keyword-based extraction (AI unavailable)", false);
    }

    @AllArgsConstructor
    @Getter
    public static class SkillExtractionResult {
        private final List<SkillWeight> skills;
        private final String explanation;
        private final boolean usedAi;
    }

    @AllArgsConstructor
    @Getter
    public static class SkillWeight {
        private final String name;
        private final double weight;
    }
}
