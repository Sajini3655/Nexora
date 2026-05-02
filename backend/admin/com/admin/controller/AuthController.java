package com.admin.controller;

import com.admin.dto.AcceptInviteRequest;
import com.admin.dto.AuthResponse;
import com.admin.dto.ChangePasswordRequest;
import com.admin.dto.InviteLookupResponse;
import com.admin.dto.LoginRequest;
import com.admin.dto.RegisterRequest;
import com.admin.dto.UserResponse;
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
        InviteLookupResponse inviteInfo = authService.getInviteInfo(request.getToken());

        AuthResponse response = authService.register(request);

        auditLogService.log(
                "REGISTERED_USER",
                inviteInfo.getEmail(),
                inviteInfo.getEmail(),
                "User registered with role " + inviteInfo.getRole()
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
    public ResponseEntity<InviteLookupResponse> getInviteInfo(@RequestParam String token) {
        return ResponseEntity.ok(authService.getInviteInfo(token));
    }

    @PostMapping("/accept-invite")
    public ResponseEntity<Map<String, String>> acceptInvite(
            @Valid @RequestBody AcceptInviteRequest request
    ) {
        String email = authService.getInviteEmailForAudit(request.getToken());

        authService.acceptInvite(request.getToken(), request.getPassword());

        auditLogService.log(
                "ACCEPTED_INVITE",
                email,
                email,
                "User accepted invite and activated account"
        );

        return ResponseEntity.ok(Map.of("message", "Account activated successfully"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        String email = authentication.getName();
        authService.changePassword(email, request);

        auditLogService.log(
                "CHANGED_PASSWORD",
                email,
                email,
                "User changed password"
        );

        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}