package com.admin.service;

import com.admin.dto.InviteRequest;
import com.admin.dto.PageResponse;
import com.admin.dto.UserResponse;
import com.admin.entity.InviteToken;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final InviteTokenRepository inviteTokenRepository;
    private final UserRepository userRepository;
    private final MailService mailService;

    private static final String PRODUCTION_FRONTEND_URL = "https://nexora1-lemon.vercel.app";

    @Value("${app.frontend.base-url:" + PRODUCTION_FRONTEND_URL + "}")
    private String frontendBaseUrl;

    // -----------------------------
    // GET USERS WITH FILTER + PAGINATION
    // -----------------------------
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(
            String q,
            String role,
            Boolean enabled,
            int page,
            int size
    ) {

        int offset = page * size;

        List<User> users = userRepository.findByFiltersNative(
                (q == null || q.isBlank()) ? null : q,
                (role == null || role.isBlank()) ? null : role,
                enabled,
                size,
                offset
        );

        long total = userRepository.countByFilters(
                (q == null || q.isBlank()) ? null : q,
                (role == null || role.isBlank()) ? null : role,
                enabled
        );

        List<UserResponse> content = users.stream()
                .map(this::toUserResponse)
                .toList();

        int totalPages = (int) Math.ceil((double) total / size);

        return PageResponse.<UserResponse>builder()
        .items(content)
        .total(total)
        .page(page)
        .size(size)
        .totalPages(totalPages)
        .build();
    }

    // -----------------------------
    // Invite new user
    // -----------------------------
    @Transactional
    public Map<String, String> inviteUser(InviteRequest request) {

        String email = request.getEmail().trim().toLowerCase();
        String name = request.getName().trim();

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .role(request.getRole())
                .enabled(false)
                .build();

        userRepository.save(user);

        String token = UUID.randomUUID().toString();

        InviteToken inviteToken = InviteToken.builder()
                .token(token)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60 * 60 * 24))
                .used(false)
                .build();

        inviteTokenRepository.save(inviteToken);

        String baseUrl = (frontendBaseUrl == null || frontendBaseUrl.isBlank())
                ? PRODUCTION_FRONTEND_URL
                : frontendBaseUrl;
        String inviteUrl = baseUrl.replaceAll("/+$", "") + "/register?token=" + token;

        Map<String, String> response = new HashMap<>();
        response.put("inviteUrl", inviteUrl);

        try {
            mailService.sendInviteEmail(
                    email,
                    name,
                    user.getRole().name(),
                    inviteUrl,
                    null
            );
            response.put("message", "Invite email sent successfully.");
        } catch (MailException ex) {
            log.error("Failed to send invite email to {}: {}", email, ex.getMessage(), ex);
            response.put("message", "Invite created, but email delivery failed. Copy and share the invite link.");
        }

        return response;
    }

    // -----------------------------
    // Enable or disable a user
    // -----------------------------
    @Transactional
    public void updateUserStatus(Long userId, Boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setEnabled(enabled);
        userRepository.save(user);
    }

    // -----------------------------
    // Delete a user safely
    // -----------------------------
 @Transactional
public void deleteUser(Long userId) {

    if (!userRepository.existsById(userId)) {
        throw new ResourceNotFoundException("User not found");
    }

    // Delete invite tokens first
    inviteTokenRepository.deleteByUser_Id(userId);  // <-- match repository

    // Then delete the user
    userRepository.deleteById(userId);
}



    // -----------------------------
    // Convert User entity to DTO
    // -----------------------------
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
