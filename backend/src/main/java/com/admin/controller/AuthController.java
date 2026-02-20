package com.admin.controller;

import com.admin.dto.*;
import com.admin.entity.InviteToken;
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

    // Complete registration using token + password (old / register endpoint)
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Get current user info
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(authService.me(email));
    }

    // ✅ Fetch invite token info for registration form (GET)
    @GetMapping("/accept-invite")
    public ResponseEntity<Map<String, String>> getInviteEmail(@RequestParam String token) {
        InviteToken inviteToken = authService.getInviteToken(token);

        Map<String, String> response = Map.of(
                "email", inviteToken.getUser().getEmail(),
                "name", inviteToken.getUser().getName()
        );
        return ResponseEntity.ok(response);
    }

    // ✅ Complete registration (set password + activate user) (POST)
    @PostMapping("/accept-invite")
    public ResponseEntity<String> acceptInvite(
            @RequestParam String token,
            @RequestParam String password
    ) {
        authService.acceptInvite(token, password);
        return ResponseEntity.ok("Account activated successfully");
    }
}
