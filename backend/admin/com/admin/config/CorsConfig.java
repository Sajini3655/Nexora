package com.admin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> allowedOrigins = new ArrayList<>();
        // Add frontend URL from environment
        if (frontendBaseUrl != null && !frontendBaseUrl.isBlank()) {
            allowedOrigins.add(frontendBaseUrl.trim());
        }
        // Explicit production and preview origins used by the app
        allowedOrigins.add("https://nexora-three-peach.vercel.app");
        allowedOrigins.add("https://nexora-ab6g.onrender.com");
        // Add development URLs
        allowedOrigins.add("http://localhost:5173");
        allowedOrigins.add("http://127.0.0.1:5173");
        allowedOrigins.add("http://localhost:3000");
        allowedOrigins.add("http://127.0.0.1:3000");

        // Allow patterns for Vercel previews and local development, while keeping exact origins for production
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedOriginPatterns(List.of(
                "https://*.vercel.app",
                "https://*.onrender.com",
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://localhost:*"
        ));

        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With",
                "Access-Control-Allow-Origin",
                "Cache-Control"
        ));
        config.setExposedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Access-Control-Allow-Origin"
        ));
        config.setAllowCredentials(true);

        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
