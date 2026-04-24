package com.admin.config;

import com.admin.entity.User;
import com.admin.repository.UserRepository;
import com.admin.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new JwtHandshakeHandler(jwtService, userRepository))
                .withSockJS();
    }

    private static class JwtHandshakeHandler extends DefaultHandshakeHandler {
        private final JwtService jwtService;
        private final UserRepository userRepository;

        private JwtHandshakeHandler(JwtService jwtService, UserRepository userRepository) {
            this.jwtService = jwtService;
            this.userRepository = userRepository;
        }

        @Override
        protected Principal determineUser(
                org.springframework.http.server.ServerHttpRequest request,
                WebSocketHandler wsHandler,
                Map<String, Object> attributes
        ) {
            String token = extractToken(request);
            if (token == null || token.isBlank()) {
                throw new IllegalStateException("WebSocket token is required");
            }

            String email = jwtService.extractUsername(token);
            if (email == null || email.isBlank()) {
                throw new IllegalStateException("Invalid WebSocket token");
            }

            User user = userRepository.findByEmailIgnoreCase(email.trim().toLowerCase())
                    .orElseThrow(() -> new IllegalStateException("WebSocket user not found"));

            if (!jwtService.isTokenValid(token, user)) {
                throw new IllegalStateException("Expired or invalid WebSocket token");
            }

            return new UsernamePasswordAuthenticationToken(user.getEmail(), null, Collections.emptyList());
        }

        private String extractToken(org.springframework.http.server.ServerHttpRequest request) {
            String token = UriComponentsBuilder.fromUri(request.getURI())
                    .build()
                    .getQueryParams()
                    .getFirst("token");

            if (token != null && !token.isBlank()) {
                return token;
            }

            String authorizationHeader = request.getHeaders().getFirst("Authorization");
            if (authorizationHeader == null || authorizationHeader.isBlank()) {
                return null;
            }

            if (authorizationHeader.startsWith("Bearer ")) {
                return authorizationHeader.substring(7).trim();
            }

            return authorizationHeader.trim();
        }
    }
}