package com.admin.service.nlq;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Minimal Groq OpenAI-compatible chat client.
 * Calls: POST https://api.groq.com/openai/v1/chat/completions
 */
@Component
public class GroqChatClient {

    private final HttpClient http;
    private final ObjectMapper om;

    private final String apiKey;
    private final String baseUrl;
    private final String model;

    public GroqChatClient(
            ObjectMapper om,
            @Value("${groq.api-key:}") String apiKey,
            @Value("${groq.base-url:https://api.groq.com/openai/v1}") String baseUrl,
            @Value("${groq.model:llama-3.3-70b-versatile}") String model
    ) {
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.om = om;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
    }

    /** @return assistant message content */
    public String chat(String system, String user) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Groq API key missing. Set groq.api-key in application.properties or GROQ_API_KEY as env var."
            );
        }

        try {
            var payload = Map.of(
                    "model", model,
                    "temperature", 0,
                    "max_tokens", 200,
                    "messages", List.of(
                            Map.of("role", "system", "content", system),
                            Map.of("role", "user", "content", user)
                    )
            );

            String body = om.writeValueAsString(payload);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/chat/completions"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() < 200 || res.statusCode() >= 300) {
                throw new RuntimeException("Groq API error: HTTP " + res.statusCode() + " -> " + res.body());
            }

            GroqChatResponse parsed = om.readValue(res.body(), GroqChatResponse.class);
            if (parsed.choices == null || parsed.choices.isEmpty() || parsed.choices.get(0).message == null) {
                throw new RuntimeException("Groq response missing choices/message.");
            }
            return parsed.choices.get(0).message.content;
        } catch (Exception e) {
            throw new RuntimeException("Groq chat failed: " + e.getMessage(), e);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class GroqChatResponse {
        public List<Choice> choices;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Choice {
        public Message message;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Message {
        public String content;
    }
}