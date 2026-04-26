package com.admin.service;

import com.admin.dto.CreateRoleWithUserRequest;
import com.admin.dto.InviteRequest;
import com.admin.dto.PageResponse;
import com.admin.dto.UserResponse;
import com.admin.entity.*;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserService {

    private final InviteTokenRepository inviteTokenRepository;
    private final UserRepository userRepository;
    private final RoleDefinitionRepository roleRepository;
    private final MailService mailService;
    private final AuditLogService auditLogService;
    private final TaskRepository taskRepository;
    private final TicketRepository ticketRepository;
    private final DeveloperProfileRepository developerProfileRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;

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

        RoleDefinition role = roleRepository.findByNameIgnoreCase(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRole()));

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user != null && Boolean.TRUE.equals(user.getEnabled())) {
            throw new RuntimeException("A user with this email already exists.");
        }

        if (user == null) {
            user = User.builder()
                    .name(name)
                    .email(email)
                    .role(role)
                    .enabled(false)
                    .build();
        } else {
            user.setName(name);
            user.setRole(role);
            user.setEnabled(false);
        }

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
        String roleName = role.getName();

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

        return response;
    }

    @Transactional
    public RoleDefinition createRoleWithUser(CreateRoleWithUserRequest request) {
        String roleName = request.getRoleName() == null ? "" : request.getRoleName().trim();
        if (roleName.isBlank()) {
            throw new RuntimeException("Role name is required.");
        }

        if (roleRepository.existsByNameIgnoreCase(roleName)) {
            throw new RuntimeException("Role already exists.");
        }

        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        String name = request.getUserName() == null ? "" : request.getUserName().trim();
        String password = request.getPassword() == null ? "" : request.getPassword().trim();

        if (!email.isBlank()) {
            if (name.length() < 2) {
                throw new RuntimeException("User name must be at least 2 characters long.");
            }
            if (!Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matcher(email).matches()) {
                throw new RuntimeException("Invalid email address.");
            }
            if (password.length() < 6) {
                throw new RuntimeException("Password must be at least 6 characters long.");
            }

            User existingUser = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (existingUser != null && Boolean.TRUE.equals(existingUser.getEnabled())) {
                throw new RuntimeException("A user with this email already exists.");
            }
        }

        try {
            RoleDefinition role = RoleDefinition.builder()
                    .name(roleName.toUpperCase())
                    .systemRole(false)
                    .build();

            String[] modules = {"DASHBOARD", "TASKS", "CHAT", "FILES", "REPORTS"};
            for (String module : modules) {
                role.getPermissions().add(RolePermission.builder()
                        .role(role)
                        .moduleKey(module)
                        .canAccess(false)
                        .build());
            }

            role = roleRepository.save(role);

            if (!email.isBlank()) {
                User existingUser = userRepository.findByEmailIgnoreCase(email).orElse(null);
                User user = existingUser == null ? User.builder().build() : existingUser;
                user.setName(name);
                user.setEmail(email);
                user.setRole(role);
                user.setPassword(passwordEncoder.encode(password));
                user.setEnabled(true);
                userRepository.save(user);
            }

            return role;
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw buildRoleUserCreationException(ex);
        }
    }

    private RuntimeException buildRoleUserCreationException(org.springframework.dao.DataIntegrityViolationException ex) {
        String rootMessage = ex.getRootCause() != null ? ex.getRootCause().getMessage() : ex.getMessage();
        if (rootMessage != null) {
            String lower = rootMessage.toLowerCase();
            if (lower.contains("role_definition") || lower.contains("role_definition.name") || (lower.contains("unique") && lower.contains("role"))) {
                return new RuntimeException("A role with this name already exists.");
            }
            if (lower.contains("user") && lower.contains("email")) {
                return new RuntimeException("A user with this email already exists.");
            }
        }
        return new RuntimeException("Role or user creation failed. Please check the role name and email and try again.", ex);
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
        String roleName = user.getRole() != null ? user.getRole().getName() : "CLIENT";

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
    }

    @Transactional
    public String updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        RoleDefinition newRole = roleRepository.findByNameIgnoreCase(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        String oldRoleName = user.getRole() != null ? user.getRole().getName() : "NONE";
        user.setRole(newRole);
        userRepository.save(user);

        if (newRole.getName().equalsIgnoreCase("DEVELOPER")) {
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
                    "Changed role from " + oldRoleName + " to " + newRole.getName()
            );
        } catch (Exception e) {
            e.printStackTrace();
        }

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

        return "User deleted successfully.";
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().getName() : "CLIENT")
                .enabled(user.getEnabled())
                .allowedModules(user.getRole() != null ? 
                    user.getRole().getPermissions().stream()
                        .filter(RolePermission::isCanAccess)
                        .map(RolePermission::getModuleKey)
                        .collect(java.util.stream.Collectors.toList()) 
                    : java.util.Collections.emptyList())
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