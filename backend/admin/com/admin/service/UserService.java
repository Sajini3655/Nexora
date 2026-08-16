package com.admin.service;

import com.admin.dto.InviteRequest;
import com.admin.dto.PageResponse;
import com.admin.dto.UserResponse;
import com.admin.entity.ChatMessage;
import com.admin.entity.ChatSession;
import com.admin.entity.DeveloperProfile;
import com.admin.entity.ExperienceLevel;
import com.admin.entity.InviteToken;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskStoryPoint;
import com.admin.entity.Ticket;
import com.admin.entity.TimesheetEntry;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ChatMessageRepository;
import com.admin.repository.ChatSessionRepository;
import com.admin.repository.DeveloperProfileRepository;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.TimesheetEntryRepository;
import com.admin.repository.UserModuleOverrideRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.HashMap;
import java.util.HashSet;
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
    private final TaskStoryPointRepository taskStoryPointRepository;
    private final TicketRepository ticketRepository;
    private final TimesheetEntryRepository timesheetEntryRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final DeveloperProfileRepository developerProfileRepository;
    private final ProjectRepository projectRepository;
    private final UserModuleOverrideRepository userModuleOverrideRepository;
    private final JdbcTemplate jdbcTemplate;
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
        Role roleFilter = parseRoleFilter(role);
        String searchTerm = q == null ? "" : q.trim().toLowerCase();

        List<User> users = userRepository.findByFilters(
            searchTerm,
            roleFilter,
                enabled,
            PageRequest.of(safePage, safeSize)
        ).getContent();

        long total = userRepository.countByFilters(
            searchTerm,
            roleFilter,
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

        // Soft delete: Disable the user instead of hard delete
        // This preserves all historical data (tasks, tickets, projects, timesheets, etc.)
        // while preventing the user from:
        // - Logging in (checked in AuthService and UserDetails.isEnabled())
        // - Appearing in active user lists (queries filter by enabled = true)
        // - Being assigned to new work
        user.setEnabled(false);
        userRepository.save(user);
        userRepository.flush();

        try {
            auditLogService.log(
                    "DELETED_USER",
                    actorEmail,
                    targetEmail,
                    "User account disabled (soft delete) - all historical records preserved"
            );
        } catch (Exception e) {
            // Log suppressed to avoid affecting user deletion if audit logging fails
        }

        try {
            liveUpdatePublisher.publishUsersChanged("deleted");
        } catch (Exception e) {
            // Log suppressed to avoid affecting user deletion if live update fails
        }

        return "User account has been disabled successfully. All historical project and task data has been preserved.";
    }

    private void forceCleanupResidualUserReferences(Long userId) {
        List<Map<String, Object>> references = jdbcTemplate.queryForList("""
            SELECT kcu.table_schema,
                   kcu.table_name,
                   kcu.column_name,
                   cols.is_nullable
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.table_schema = tc.table_schema
            JOIN information_schema.columns cols
              ON cols.table_schema = kcu.table_schema
             AND cols.table_name = kcu.table_name
             AND cols.column_name = kcu.column_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND ccu.table_name = 'users'
                            AND ccu.table_schema = current_schema()
              AND ccu.column_name = 'id'
              AND kcu.table_name <> 'users'
              AND kcu.table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY kcu.table_schema, kcu.table_name, kcu.column_name
            """);

        Set<String> visited = new HashSet<>();

        for (Map<String, Object> reference : references) {
            String schema = String.valueOf(reference.get("table_schema"));
            String table = String.valueOf(reference.get("table_name"));
            String column = String.valueOf(reference.get("column_name"));
            String nullable = String.valueOf(reference.get("is_nullable"));
            String key = schema + "." + table + "." + column;

            if (!visited.add(key)) {
                continue;
            }

            String qualifiedTable = quoteIdentifier(schema) + "." + quoteIdentifier(table);
            String quotedColumn = quoteIdentifier(column);

            if ("YES".equalsIgnoreCase(nullable)) {
                jdbcTemplate.update(
                        "UPDATE " + qualifiedTable + " SET " + quotedColumn + " = NULL WHERE " + quotedColumn + " = ?",
                        userId
                );
            } else {
                jdbcTemplate.update(
                        "DELETE FROM " + qualifiedTable + " WHERE " + quotedColumn + " = ?",
                        userId
                );
            }
        }
    }

    private String quoteIdentifier(String identifier) {
        if (identifier == null || !identifier.matches("[A-Za-z0-9_]+")) {
            throw new IllegalArgumentException("Unsafe SQL identifier: " + identifier);
        }
        return "\"" + identifier + "\"";
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

    private Role parseRoleFilter(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }

        try {
            return Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid role filter: " + role);
        }
    }
}
