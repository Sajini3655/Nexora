package com.admin.service;

import com.admin.dto.*;
import com.admin.entity.User;
import com.admin.entity.InviteToken;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final InviteTokenRepository inviteTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {

        InviteToken inviteToken = inviteTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid invite token"));

        if (inviteToken.getUsed()) {
            throw new RuntimeException("Invite token already used");
        }

        if (inviteToken.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Invite token expired");
        }

        User user = inviteToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(true);

        inviteToken.setUsed(true);

        userRepository.save(user);
        inviteTokenRepository.save(inviteToken);

        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .user(toUserResponse(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .user(toUserResponse(user))
                .build();
    }

    public UserResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ✅ NEW: Validate invite token without marking as used
    public InviteToken getInviteToken(String token) {
        InviteToken inviteToken = inviteTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invite token"));

        if (inviteToken.getUsed()) {
            throw new RuntimeException("Invite token already used");
        }

        if (inviteToken.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Invite token expired");
        }

        return inviteToken;
    }

    // ✅ Existing registration completion
    public void acceptInvite(String token, String password) {

        InviteToken inviteToken = inviteTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invite token"));

        if (inviteToken.getUsed()) {
            throw new RuntimeException("Invite token already used");
        }

        if (inviteToken.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Invite token expired");
        }

        User user = inviteToken.getUser();
        user.setPassword(passwordEncoder.encode(password));
        user.setEnabled(true);

        inviteToken.setUsed(true);

        userRepository.save(user);
        inviteTokenRepository.save(inviteToken);
    }
}
