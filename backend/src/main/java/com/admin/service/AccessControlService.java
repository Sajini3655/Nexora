package com.admin.service;

import com.admin.dto.AccessModuleDto;
import com.admin.dto.AccessUserDto;
import com.admin.dto.UserOverridesUpdateRequest;
import com.admin.dto.AccessModuleDto;
import com.admin.dto.AccessUserDto;
import com.admin.dto.UserOverridesUpdateRequest;
import com.admin.entity.AccessModule;
import com.admin.entity.Role;
import com.admin.entity.RoleModuleAccess;
import com.admin.entity.User;
import com.admin.entity.UserModuleOverride;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.RoleModuleAccessRepository;
import com.admin.repository.UserModuleOverrideRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccessControlService {

    private static final Logger log = LoggerFactory.getLogger(AccessControlService.class);

    private static final List<String> MANAGED_ROLES = List.of(
            "MANAGER",
            "DEVELOPER",
            "CLIENT"
    );
    private static final Pattern VALID_ROLE_NAME = Pattern.compile("^[A-Z_]+$");
    private static final Pattern NORMALIZE_ROLE_NAME_PATTERN = Pattern.compile("[^A-Z_]+" );

    private final RoleModuleAccessRepository roleModuleAccessRepository;
    private final UserModuleOverrideRepository userModuleOverrideRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AccessModuleDto> getModules() {
        return List.of(AccessModule.values()).stream()
                .map(module -> AccessModuleDto.builder()
                        .key(module.name())
                        .label(module.getLabel())
                        .desc(module.getDescription())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getRoles() {
        LinkedHashMap<String, Boolean> roleNames = new LinkedHashMap<>();
        for (String role : MANAGED_ROLES) {
            roleNames.put(role, Boolean.TRUE);
        }
        for (String role : roleModuleAccessRepository.findDistinctRoles()) {
            String normalized = normalizeRoleName(role);
            if (normalized != null) {
                roleNames.put(normalized, Boolean.TRUE);
            }
        }
        return new ArrayList<>(roleNames.keySet());
    }

    @Transactional(readOnly = true)
    public Map<String, Map<String, Boolean>> getRoleMatrix() {
        List<String> existingRoles = roleModuleAccessRepository.findDistinctRoles().stream()
                .map(this::normalizeRoleName)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        LinkedHashSet<String> allRoles = new LinkedHashSet<>(MANAGED_ROLES);
        allRoles.addAll(existingRoles);

        Map<String, Map<String, Boolean>> matrix = createDefaultRoleMatrix(new ArrayList<>(allRoles));

        try {
            List<RoleModuleAccess> persisted = roleModuleAccessRepository.findByRoleIn(new ArrayList<>(allRoles));
            for (RoleModuleAccess entry : persisted) {
                if (entry == null || entry.getRole() == null || entry.getModule() == null) {
                    continue;
                }

                String normalizedRole = normalizeRoleName(entry.getRole());
                if (normalizedRole == null) {
                    continue;
                }

                Map<String, Boolean> roleMap = matrix.get(normalizedRole);
                if (roleMap != null) {
                    roleMap.put(entry.getModule().name(), Boolean.TRUE.equals(entry.getAllowed()));
                }
            }
        } catch (RuntimeException ex) {
            log.warn("Falling back to default role matrix because persisted access rows could not be loaded: {}", ex.getMessage());
        }

        return matrix;
    }

    @Transactional
    public Map<String, Map<String, Boolean>> saveRoleMatrix(Map<String, Map<String, Object>> payload) {
        if (payload == null || payload.isEmpty()) {
            return getRoleMatrix();
        }

        Set<String> payloadRoles = payload.keySet();

        for (Map.Entry<String, Map<String, Object>> roleEntry : payload.entrySet()) {
            String rawRoleName = roleEntry.getKey();
            Map<String, Object> roleValues = roleEntry.getValue();
            if (roleValues == null || rawRoleName == null || rawRoleName.isBlank()) {
                continue;
            }
            String roleName = rawRoleName.trim();
            if (roleName.isBlank() || !VALID_ROLE_NAME.matcher(roleName).matches()) {
                log.warn("Skipping invalid role name in payload: {}", roleName);
                continue;
            }

            for (AccessModule module : AccessModule.values()) {
                if (!roleValues.containsKey(module.name())) {
                    continue;
                }

                Boolean allowed = parseBooleanValue(roleValues.get(module.name()));
                if (allowed == null) {
                    continue;
                }

                try {
                    RoleModuleAccess access = roleModuleAccessRepository
                            .findByRoleAndModule(roleName, module)
                            .or(() -> roleModuleAccessRepository.findByNormalizedRoleAndModule(roleName, module))
                            .orElse(RoleModuleAccess.builder()
                                    .role(roleName)
                                    .module(module)
                                    .build());

                    access.setAllowed(allowed);
                    try {
                        roleModuleAccessRepository.save(access);
                    } catch (DataIntegrityViolationException dive) {
                        log.warn("Unique constraint conflict saving role-matrix for role {} and module {}: {}", roleName, module.name(), dive.getMessage());
                        RoleModuleAccess existing = roleModuleAccessRepository
                                .findByNormalizedRoleAndModule(roleName, module)
                                .orElse(access);
                        existing.setAllowed(allowed);
                        roleModuleAccessRepository.save(existing);
                    }
                } catch (RuntimeException ex) {
                    log.warn("Skipping role-matrix save for role {} and module {} due to repository error: {}", roleName, module.name(), ex.getMessage());
                }
            }
        }

        try {
            List<String> existingRoles = roleModuleAccessRepository.findDistinctRoles();
            for (String existingRole : existingRoles) {
                if (MANAGED_ROLES.contains(existingRole)) {
                    continue;
                }
                if (!payloadRoles.contains(existingRole)) {
                    roleModuleAccessRepository.deleteByRole(existingRole);
                }
            }
        } catch (RuntimeException ex) {
            log.warn("Skipping role-matrix cleanup after save due to repository error: {}", ex.getMessage());
        }

        try {
            return getRoleMatrix();
        } catch (RuntimeException ex) {
            log.warn("Returning fallback role matrix after save due to repository error: {}", ex.getMessage());
            return createDefaultRoleMatrix(new ArrayList<>(MANAGED_ROLES));
        }
    }

    private Boolean parseBooleanValue(Object value) {
        if (value instanceof Boolean boolValue) {
            return boolValue;
        }
        if (value instanceof Number numberValue) {
            return numberValue.intValue() != 0;
        }
        if (value instanceof String stringValue) {
            String trimmed = stringValue.trim();
            if (trimmed.isEmpty()) {
                return null;
            }
            return Boolean.parseBoolean(trimmed);
        }
        return null;
    }

    private String normalizeRoleName(String rawRoleName) {
        if (rawRoleName == null) {
            return null;
        }
        String normalized = rawRoleName
                .trim()
                .toUpperCase()
                .replaceAll(NORMALIZE_ROLE_NAME_PATTERN.pattern(), "_")
                .replaceAll("_+", "_")
                .replaceAll("^_+|_+$", "");

        if (normalized.isBlank() || !VALID_ROLE_NAME.matcher(normalized).matches()) {
            return null;
        }
        return normalized;
    }

    @Transactional(readOnly = true)
    public List<AccessUserDto> getUsers(String roleFilter) {
        List<User> users;

        if (roleFilter != null && !roleFilter.isBlank()) {
            Role role = parseManagedRole(roleFilter);
            users = userRepository.findByRoleOrderByNameAsc(role);
        } else {
            users = new ArrayList<>();
            for (String roleName : MANAGED_ROLES) {
                users.addAll(userRepository.findByRoleOrderByNameAsc(Role.valueOf(roleName)));
            }
        }

        return users.stream()
                .map(user -> AccessUserDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> getUserOverrides(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ensureManagedRole(user.getRole());

        return userModuleOverrideRepository.findByUser_Id(userId)
                .stream()
                .collect(Collectors.toMap(
                        entry -> entry.getModule().name(),
                        UserModuleOverride::getAllowed,
                        (first, second) -> second,
                        LinkedHashMap::new
                ));
    }

    @Transactional
    public Map<String, Boolean> saveUserOverrides(UserOverridesUpdateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ensureManagedRole(user.getRole());

        Map<String, Boolean> payload = request.getOverrides();
        if (payload == null) {
            return getUserOverrides(user.getId());
        }

        Set<String> validModules = List.of(AccessModule.values())
                .stream()
                .map(Enum::name)
                .collect(Collectors.toSet());

        for (Map.Entry<String, Boolean> entry : payload.entrySet()) {
            String moduleKey = entry.getKey();
            if (!validModules.contains(moduleKey)) {
                continue;
            }

            AccessModule module = AccessModule.valueOf(moduleKey);
            Boolean allowed = entry.getValue();

            if (allowed == null) {
                userModuleOverrideRepository.deleteByUser_IdAndModule(user.getId(), module);
                continue;
            }

            UserModuleOverride override = userModuleOverrideRepository
                    .findByUser_IdAndModule(user.getId(), module)
                    .orElse(UserModuleOverride.builder()
                            .user(user)
                            .module(module)
                            .build());

            override.setAllowed(allowed);
            userModuleOverrideRepository.save(override);
        }

        return getUserOverrides(user.getId());
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> getEffectiveAccessForUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return getEffectiveAccessForUser(user);
        }

        @Transactional(readOnly = true)
        public Map<String, Boolean> getEffectiveAccessForUserId(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return getEffectiveAccessForUser(user);
        }

        private Map<String, Boolean> getEffectiveAccessForUser(User user) {

        Map<String, Boolean> effective = new LinkedHashMap<>();
            Set<Role> userRoles = user.getAllRoles();

            if (userRoles.contains(Role.ADMIN)) {
            for (AccessModule module : AccessModule.values()) {
                effective.put(module.name(), true);
            }
            return effective;
        }

        Map<String, Map<String, Boolean>> roleMatrix = getRoleMatrix();

        for (AccessModule module : AccessModule.values()) {
                boolean allowed = false;

                for (Role role : userRoles) {
                    Map<String, Boolean> roleAccess = roleMatrix.getOrDefault(role.name(), Map.of());
                    if (Boolean.TRUE.equals(roleAccess.get(module.name()))) {
                        allowed = true;
                        break;
                    }
                }

                effective.put(module.name(), allowed);
        }

            if (userRoles.stream().noneMatch(MANAGED_ROLES::contains)) {
            return effective;
        }

        List<UserModuleOverride> overrides = userModuleOverrideRepository.findByUser_Id(user.getId());
        for (UserModuleOverride override : overrides) {
            effective.put(override.getModule().name(), Boolean.TRUE.equals(override.getAllowed()));
        }

        return effective;
    }

    private void ensureManagedRole(Role role) {
        if (!MANAGED_ROLES.contains(role.name())) {
            throw new RuntimeException("Overrides are allowed only for manager, developer, or client users.");
        }
    }

    private Role parseManagedRole(String roleFilter) {
        Role role;
        try {
            role = Role.valueOf(roleFilter.trim().toUpperCase());
        } catch (Exception ex) {
            throw new RuntimeException("Invalid role: " + roleFilter);
        }

        ensureManagedRole(role);
        return role;
    }

    private Map<String, Map<String, Boolean>> createDefaultRoleMatrix(List<String> roles) {
        Map<String, Map<String, Boolean>> matrix = new LinkedHashMap<>();

        for (String role : roles) {
            Map<String, Boolean> roleMap = new LinkedHashMap<>();
            for (AccessModule module : AccessModule.values()) {
                boolean allowed;
                if ("CLIENT".equals(role)) {
                    allowed = module == AccessModule.DASHBOARD || module == AccessModule.CHAT;
                } else if (MANAGED_ROLES.contains(role)) {
                    allowed = true;
                } else {
                    allowed = false;
                }

                roleMap.put(module.name(), allowed);
            }
            matrix.put(role, roleMap);
        }

        return matrix;
    }
}
