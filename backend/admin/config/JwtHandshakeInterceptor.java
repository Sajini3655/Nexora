package com.admin.config;

import com.admin.service.JwtService;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtHandshakeInterceptor(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public boolean beforeHandshake(@NonNull ServerHttpRequest request, @NonNull org.springframework.http.server.ServerHttpResponse response, @NonNull WebSocketHandler wsHandler, @NonNull Map<String, Object> attributes) throws Exception {
        try {
            if (request instanceof ServletServerHttpRequest servletReq) {
                var servlet = servletReq.getServletRequest();

                String token = servlet.getParameter("token");
                if (token == null || token.isBlank()) {
                    // Try Authorization header
                    String authHeader = servlet.getHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        token = authHeader.substring(7);
                    }
                }

                if (token != null && !token.isBlank()) {
                    String username = jwtService.extractUsername(token);
                    if (username != null) {
                        try {
                            var userDetails = userDetailsService.loadUserByUsername(username);
                            if (jwtService.isTokenValid(token, userDetails)) {
                                attributes.put("principal", new StompPrincipal(username));
                            }
                        } catch (Exception e) {
                            // ignore - invalid token or user
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }

        return true;
    }

    @Override
    public void afterHandshake(@NonNull ServerHttpRequest request, @NonNull org.springframework.http.server.ServerHttpResponse response, @NonNull WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}
