package com.admin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.admin.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> allowedOrigins = new ArrayList<>();
        if (frontendBaseUrl != null && !frontendBaseUrl.isBlank()) {
            allowedOrigins.add(frontendBaseUrl.trim());
        }
        allowedOrigins.add("https://nexora-three-peach.vercel.app");
        allowedOrigins.add("https://nexora-ab6g.onrender.com");
        // Add development URLs
        allowedOrigins.add("http://localhost:5173");
        allowedOrigins.add("http://127.0.0.1:5173");
        allowedOrigins.add("http://localhost:3000");
        allowedOrigins.add("http://127.0.0.1:3000");

        registry.addEndpoint("/ws")
            .setHandshakeHandler(new CustomHandshakeHandler())
            .setAllowedOrigins(allowedOrigins.toArray(new String[0]))
            .setAllowedOriginPatterns(
                "https://*.vercel.app",
                "https://*.onrender.com",
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://localhost:*"
            )
            .addInterceptors(new JwtHandshakeInterceptor(jwtService, userDetailsService))
            .withSockJS();
    }
}
