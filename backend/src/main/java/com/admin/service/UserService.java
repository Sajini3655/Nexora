package com.admin.service;

import com.admin.dto.InviteRequest;
import com.admin.dto.PageResponse;
import com.admin.dto.UserResponse;
import com.admin.entity.DeveloperProfile;
import com.admin.entity.ExperienceLevel;
import com.admin.entity.InviteToken;
import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.DeveloperProfileRepository;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final InviteTokenRepository inviteTokenRepository;
    private final UserRepository userRepository;
    private final MailService mailService;
    private final AuditLogService auditLogService;
    private final TaskRepository taskRepository;
    private final TicketRepository ticketRepository;
    private final DeveloperProfileRepository developerProfileRepository;
    private final ProjectRepository projectRepository;
    private final LiveUpdatePublisher liveUpdatePublisher;

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

        Set<Role> normalizedRoles = normalizeRoles(request.getRole(), request.getRoles());
        Role primaryRole = normalizedRoles.iterator().next();

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user != null && Boolean.TRUE.equals(user.getEnabled())) {
            throw new RuntimeException("A user with this email already exists.");
        }

        if (user == null) {
            user = User.builder()
                    .name(name)
                    .email(email)
                    .role(primaryRole)
                    .additionalRoles(new LinkedHashSet<>(normalizedRoles))
                    .enabled(false)
                    .build();
        } else {
            user.setName(name);
            user.setRole(primaryRole);
            user.setAdditionalRoles(new LinkedHashSet<>(normalizedRoles));
            user.setEnabled(false);
        }

        user.getAdditionalRoles().remove(user.getRole());

        user = userRepository.save(user);

        inviteTokenRepository.deleteByUser_Id(user.getId());

        String token = UUID.randomUUID().toString();

        InviteToken inviteToken = InviteToken.builder()
                .token(token)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60 * 60 * 24))
                .used(false)
                .build();

        inviteTokenRepository.save(inviteToken);

        String inviteUrl = frontendBaseUrl + "/auth/accept-invite?token=" + token;
        String targetEmail = user.getEmail();
        String targetName = user.getName();
        String roleName = user.getRole().name();

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
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Invite created successfully.");
        response.put("inviteUrl", inviteUrl);
        response.put("emailStatus", "PENDING");

        liveUpdatePublisher.publishUsersChanged("invited");

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

        String inviteUrl = frontendBaseUrl + "/auth/accept-invite?token=" + token;
        String targetEmail = user.getEmail();
        String targetName = user.getName();
        String roleName = user.getRole().name();

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
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Invite resent successfully.");
        response.put("inviteUrl", inviteUrl);
        response.put("emailStatus", "PENDING");

        liveUpdatePublisher.publishUsersChanged("invite-resent");

        return response;
    }

    @Transactional
    public void updateUserStatus(Long userId, Boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setEnabled(enabled);
        userRepository.save(user);

        String actorEmail = getCurrentActorEmail();
        String targetEmail = user.getEmail();
        String action = Boolean.TRUE.equals(enabled) ? "ENABLED_USER" : "DISABLED_USER";
        String details = Boolean.TRUE.equals(enabled)
                ? "Enabled user account"
                : "Disabled user account";

        try {
            auditLogService.log(action, actorEmail, targetEmail, details);
        } catch (Exception e) {
            e.printStackTrace();
        }

        liveUpdatePublisher.publishUsersChanged("status-updated");
    }

    @Transactional
    public String updateUserRole(Long userId, Role role, Set<Role> roles) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Set<Role> normalizedRoles = normalizeRoles(role, roles);
        Role newPrimaryRole = normalizedRoles.iterator().next();

        Role oldRole = user.getRole();
        user.setRole(newPrimaryRole);
        user.setAdditionalRoles(new LinkedHashSet<>(normalizedRoles));
        user.getAdditionalRoles().remove(user.getRole());
        userRepository.save(user);

        if (normalizedRoles.contains(Role.DEVELOPER)) {
            DeveloperProfile existingProfile = developerProfileRepository.findByUser_Id(userId).orElse(null);

            if (existingProfile == null) {
                DeveloperProfile profile = DeveloperProfile.builder()
                        .user(user)
                        .experienceLevel(ExperienceLevel.JUNIOR)
                        .capacityPoints(20)
                        .phone(null)
                        .location(null)
                        .bio(null)
                        .build();

                developerProfileRepository.save(profile);
            }
        }

        String actorEmail = getCurrentActorEmail();
        String targetEmail = user.getEmail();

        try {
            auditLogService.log(
                    "UPDATED_ROLE",
                    actorEmail,
                    targetEmail,
                    "Changed role from " + oldRole + " to " + normalizedRoles
            );
        } catch (Exception e) {
            e.printStackTrace();
        }

        liveUpdatePublisher.publishUsersChanged("role-updated");

        return "User role updated successfully.";
    }

    @Transactional
    public String deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String actorEmail = getCurrentActorEmail();
        String targetEmail = user.getEmail();

        if (targetEmail.equalsIgnoreCase(actorEmail)) {
            throw new RuntimeException("You cannot delete your own account.");
        }

        long taskCreatedRefs = taskRepository.countByCreatedBy_Id(userId);
        long taskAssignedRefs = taskRepository.countByAssignedTo_Id(userId);

        long ticketCreatedRefs = ticketRepository.countByCreatedBy_Id(userId);
        long ticketAssignedRefs = ticketRepository.countByAssignedTo_Id(userId);

        long profileRefs = developerProfileRepository.countByUser_Id(userId);
        long projectRefs = projectRepository.countByManager_Id(userId);

        boolean hasDependencies =
                taskCreatedRefs > 0 ||
                taskAssignedRefs > 0 ||
                ticketCreatedRefs > 0 ||
                ticketAssignedRefs > 0 ||
                profileRefs > 0 ||
                projectRefs > 0;

        if (hasDependencies) {
            user.setEnabled(false);
            userRepository.save(user);

            try {
                auditLogService.log(
                        "DISABLED_USER",
                        actorEmail,
                        targetEmail,
                        "User had related records, so account was disabled instead of deleted"
                );
            } catch (Exception e) {
                e.printStackTrace();
            }

            liveUpdatePublisher.publishUsersChanged("disabled");

            return "User has related records. Disabled instead of deleted.";
        }

        inviteTokenRepository.deleteByUser_Id(userId);
        userRepository.deleteById(userId);

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

        liveUpdatePublisher.publishUsersChanged("deleted");

        return "User deleted successfully.";
    }

    private UserResponse toUserResponse(User user) {
        List<Role> roles = new ArrayList<>(user.getAllRoles());
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .roles(roles)
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private Set<Role> normalizeRoles(Role role, Set<Role> roles) {
        LinkedHashSet<Role> normalized = new LinkedHashSet<>();

        if (role != null) {
            normalized.add(role);
        }

        if (roles != null) {
            roles.stream().filter(r -> r != null).forEach(normalized::add);
        }

        if (normalized.isEmpty()) {
            normalized.add(Role.CLIENT);
        }

        return normalized;
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