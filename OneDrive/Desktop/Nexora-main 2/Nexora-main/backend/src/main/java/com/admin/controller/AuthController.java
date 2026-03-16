package com.admin.controller;

import com.admin.dto.AuthResponse;
import com.admin.dto.LoginRequest;
import com.admin.dto.RegisterRequest;
import com.admin.dto.UserResponse;
import com.admin.entity.InviteToken;
import com.admin.service.AuditLogService;
import com.admin.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuditLogService auditLogService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        InviteToken inviteToken = authService.getInviteToken(request.getToken());
        String email = inviteToken.getUser().getEmail();
        String role = inviteToken.getUser().getRole().name();

        AuthResponse response = authService.register(request);

        auditLogService.log(
                "REGISTERED_USER",
                email,
                email,
                "User registered with role " + role
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(authService.me(email));
    }

    @GetMapping("/accept-invite")
    public ResponseEntity<Map<String, String>> getInviteEmail(@RequestParam String token) {
        InviteToken inviteToken = authService.getInviteToken(token);

        Map<String, String> response = Map.of(
                "email", inviteToken.getUser().getEmail(),
                "name", inviteToken.getUser().getName()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/accept-invite")
    public ResponseEntity<String> acceptInvite(
            @RequestParam String token,
            @RequestParam String password
    ) {
        InviteToken inviteToken = authService.getInviteToken(token);
        String email = inviteToken.getUser().getEmail();

        authService.acceptInvite(token, password);

        auditLogService.log(
                "ACCEPTED_INVITE",
                email,
                email,
                "User accepted invite and activated account"
        );

        return ResponseEntity.ok("Account activated successfully");
    }
}