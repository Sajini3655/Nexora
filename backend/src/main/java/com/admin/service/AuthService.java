package com.admin.service;

import com.admin.dto.AuthResponse;
import com.admin.dto.ChangePasswordRequest;
import com.admin.dto.InviteLookupResponse;
import com.admin.dto.LoginRequest;
import com.admin.dto.RegisterRequest;
import com.admin.dto.UserResponse;
import com.admin.entity.InviteToken;
import com.admin.entity.User;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final InviteTokenRepository inviteTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String token = safeTrim(request.getToken());
        InviteToken inviteToken = validateInviteToken(token);

        User user = inviteToken.getUser();

        if (Boolean.TRUE.equals(user.getEnabled()) && user.getPassword() != null) {
            throw new RuntimeException("This account is already active.");
        }

        String rawPassword = safeTrim(request.getPassword());
        if (rawPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters long.");
        }

        user.setPassword(passwordEncoder.encode(rawPassword));
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
        String email = safeTrim(request.getEmail()).toLowerCase();
        String password = request.getPassword() == null ? "" : request.getPassword();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .user(toUserResponse(user))
                .build();
    }

    public UserResponse me(String email) {
        String normalizedEmail = safeTrim(email).toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return toUserResponse(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        String normalizedEmail = safeTrim(email).toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String currentPassword = request.getCurrentPassword() == null ? "" : request.getCurrentPassword();
        String newPassword = safeTrim(request.getNewPassword());

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long");
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public InviteLookupResponse getInviteInfo(String token) {
        InviteToken inviteToken = validateInviteToken(token);
        User user = inviteToken.getUser();

        return InviteLookupResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public void acceptInvite(String token, String password) {
        String safeToken = safeTrim(token);
        InviteToken inviteToken = validateInviteToken(safeToken);

        User user = inviteToken.getUser();

        if (Boolean.TRUE.equals(user.getEnabled()) && user.getPassword() != null) {
            throw new RuntimeException("This account is already active.");
        }

        String rawPassword = safeTrim(password);
        if (rawPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters long.");
        }

        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEnabled(true);

        inviteToken.setUsed(true);

        userRepository.save(user);
        inviteTokenRepository.save(inviteToken);
    }

    @Transactional(readOnly = true)
    public String getInviteEmailForAudit(String token) {
        InviteToken inviteToken = validateInviteToken(token);
        return inviteToken.getUser().getEmail();
    }

    private InviteToken validateInviteToken(String token) {
        String safeToken = safeTrim(token);

        if (safeToken.isBlank()) {
            throw new RuntimeException("Invalid invite token");
        }

        InviteToken inviteToken = inviteTokenRepository.findByToken(safeToken)
                .orElseThrow(() -> new RuntimeException("Invalid invite token"));

        if (Boolean.TRUE.equals(inviteToken.getUsed())) {
            throw new RuntimeException("Invite token already used");
        }

        if (inviteToken.getExpiresAt() == null || inviteToken.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Invite token expired");
        }

        return inviteToken;
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
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
}