package com.admin.service;

import com.admin.dto.InviteRequest;
import com.admin.dto.PageResponse;
import com.admin.dto.UserResponse;
import com.admin.entity.InviteToken;
import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final InviteTokenRepository inviteTokenRepository;
    private final UserRepository userRepository;
    private final MailService mailService;
    private final AuditLogService auditLogService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(
            String q,
            String role,
            Boolean enabled,
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int offset = safePage * safeSize;

        List<User> users = userRepository.findByFiltersNative(
                (q == null || q.isBlank()) ? null : q.trim(),
                (role == null || role.isBlank()) ? null : role.trim().toUpperCase(),
                enabled,
                safeSize,
                offset
        );

        long total = userRepository.countByFilters(
                (q == null || q.isBlank()) ? null : q.trim(),
                (role == null || role.isBlank()) ? null : role.trim().toUpperCase(),
                enabled
        );

        List<UserResponse> content = users.stream()
                .map(this::toUserResponse)
                .toList();

        int totalPages = (int) Math.ceil((double) total / safeSize);

        return PageResponse.<UserResponse>builder()
                .items(content)
                .total(total)
                .page(safePage)
                .size(safeSize)
                .totalPages(totalPages)
                .build();
    }

    @Transactional
    public Map<String, String> inviteUser(InviteRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String name = request.getName().trim();
        String actorEmail = getCurrentActorEmail();

        if (name.length() < 2) {
            throw new RuntimeException("Name must be at least 2 characters long.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("A user with this email already exists.");
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .role(request.getRole())
                .enabled(false)
                .build();

        user = userRepository.save(user);

        String token = UUID.randomUUID().toString();

        InviteToken inviteToken = InviteToken.builder()
                .token(token)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60 * 60 * 24))
                .used(false)
                .build();

        inviteTokenRepository.save(inviteToken);

        final String inviteUrl = frontendBaseUrl + "/auth/accept-invite?token=" + token;
        final String targetEmail = user.getEmail();
        final String targetName = user.getName();
        final String roleName = user.getRole().name();

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    auditLogService.log(
                            "CREATED_USER_INVITE",
                            actorEmail,
                            targetEmail,
                            "Created invited user with role " + roleName
                    );
                } catch (Exception e) {
                    e.printStackTrace();
                }

                try {
                    mailService.sendInviteEmail(
                            targetEmail,
                            targetName,
                            roleName,
                            inviteUrl,
                            null
                    );
                } catch (Exception e) {
                    e.printStackTrace();
                    try {
                        auditLogService.log(
                                "INVITE_EMAIL_FAILED",
                                actorEmail,
                                targetEmail,
                                "Invite created but email sending failed: " + e.getMessage()
                        );
                    } catch (Exception inner) {
                        inner.printStackTrace();
                    }
                }
            }
        });

        Map<String, String> response = new HashMap<>();
        response.put("message", "Invite created successfully.");
        response.put("inviteUrl", inviteUrl);
        response.put("emailStatus", "PENDING");

        return response;
    }

    @Transactional
    public Map<String, String> resendInvite(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.TRUE.equals(user.getEnabled())) {
            throw new RuntimeException("This user is already active.");
        }

        String actorEmail = getCurrentActorEmail();

        inviteTokenRepository.deleteByUser_Id(userId);

        String token = UUID.randomUUID().toString();

        InviteToken inviteToken = InviteToken.builder()
                .token(token)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60 * 60 * 24))
                .used(false)
                .build();

        inviteTokenRepository.save(inviteToken);

        final String inviteUrl = frontendBaseUrl + "/auth/accept-invite?token=" + token;
        final String targetEmail = user.getEmail();
        final String targetName = user.getName();
        final String roleName = user.getRole().name();

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    auditLogService.log(
                            "RESENT_INVITE",
                            actorEmail,
                            targetEmail,
                            "Resent invite for role " + roleName
                    );
                } catch (Exception e) {
                    e.printStackTrace();
                }

                try {
                    mailService.sendInviteEmail(
                            targetEmail,
                            targetName,
                            roleName,
                            inviteUrl,
                            null
                    );
                } catch (Exception e) {
                    e.printStackTrace();
                    try {
                        auditLogService.log(
                                "RESEND_INVITE_EMAIL_FAILED",
                                actorEmail,
                                targetEmail,
                                "Invite resent but email sending failed: " + e.getMessage()
                        );
                    } catch (Exception inner) {
                        inner.printStackTrace();
                    }
                }
            }
        });

        Map<String, String> response = new HashMap<>();
        response.put("message", "Invite resent successfully.");
        response.put("inviteUrl", inviteUrl);
        response.put("emailStatus", "PENDING");

        return response;
    }

    @Transactional
    public void updateUserStatus(Long userId, Boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setEnabled(enabled);
        userRepository.save(user);

        final String actorEmail = getCurrentActorEmail();
        final String targetEmail = user.getEmail();
        final String action = Boolean.TRUE.equals(enabled) ? "ENABLED_USER" : "DISABLED_USER";
        final String details = Boolean.TRUE.equals(enabled)
                ? "Enabled user account"
                : "Disabled user account";

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    auditLogService.log(action, actorEmail, targetEmail, details);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @Transactional
    public void updateUserRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Role oldRole = user.getRole();
        user.setRole(role);
        userRepository.save(user);

        final String actorEmail = getCurrentActorEmail();
        final String targetEmail = user.getEmail();

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    auditLogService.log(
                            "UPDATED_ROLE",
                            actorEmail,
                            targetEmail,
                            "Changed role from " + oldRole + " to " + role
                    );
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        final String actorEmail = getCurrentActorEmail();
        final String targetEmail = user.getEmail();

        inviteTokenRepository.deleteByUser_Id(userId);
        userRepository.deleteById(userId);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    auditLogService.log(
                            "DELETED_USER",
                            actorEmail,
                            targetEmail,
                            "Deleted user account"
                    );
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
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

    private String getCurrentActorEmail() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null) {
                return authentication.getName();
            }
        } catch (Exception ignored) {
        }
        return "system";
    }
}