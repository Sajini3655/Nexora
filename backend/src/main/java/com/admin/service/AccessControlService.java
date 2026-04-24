package com.admin.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccessControlService {

    private static final List<Role> MANAGED_ROLES = List.of(
            Role.MANAGER,
            Role.DEVELOPER,
            Role.CLIENT
    );

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
        return MANAGED_ROLES.stream().map(Enum::name).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Map<String, Boolean>> getRoleMatrix() {
        Map<String, Map<String, Boolean>> matrix = createDefaultRoleMatrix();

        List<RoleModuleAccess> persisted = roleModuleAccessRepository.findByRoleIn(MANAGED_ROLES);
        for (RoleModuleAccess entry : persisted) {
            Map<String, Boolean> roleMap = matrix.get(entry.getRole().name());
            if (roleMap != null) {
                roleMap.put(entry.getModule().name(), Boolean.TRUE.equals(entry.getAllowed()));
            }
        }

        return matrix;
    }

    @Transactional
    public Map<String, Map<String, Boolean>> saveRoleMatrix(Map<String, Map<String, Boolean>> payload) {
        if (payload == null || payload.isEmpty()) {
            return getRoleMatrix();
        }

        for (Role role : MANAGED_ROLES) {
            Map<String, Boolean> roleValues = payload.get(role.name());
            if (roleValues == null) {
                continue;
            }

            for (AccessModule module : AccessModule.values()) {
                if (!roleValues.containsKey(module.name())) {
                    continue;
                }

                Boolean allowed = roleValues.get(module.name());
                if (allowed == null) {
                    continue;
                }

                RoleModuleAccess access = roleModuleAccessRepository
                        .findByRoleAndModule(role, module)
                        .orElse(RoleModuleAccess.builder()
                                .role(role)
                                .module(module)
                                .build());

                access.setAllowed(allowed);
                roleModuleAccessRepository.save(access);
            }
        }

        return getRoleMatrix();
    }

    @Transactional(readOnly = true)
    public List<AccessUserDto> getUsers(String roleFilter) {
        List<User> users;

        if (roleFilter != null && !roleFilter.isBlank()) {
            Role role = parseManagedRole(roleFilter);
            users = userRepository.findByRoleOrderByNameAsc(role);
        } else {
            users = new ArrayList<>();
            for (Role role : MANAGED_ROLES) {
                users.addAll(userRepository.findByRoleOrderByNameAsc(role));
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

        if (user.getRole() == Role.ADMIN) {
            for (AccessModule module : AccessModule.values()) {
                effective.put(module.name(), true);
            }
            return effective;
        }

        Map<String, Map<String, Boolean>> roleMatrix = getRoleMatrix();
        Map<String, Boolean> roleAccess = roleMatrix.getOrDefault(user.getRole().name(), Map.of());

        for (AccessModule module : AccessModule.values()) {
            effective.put(module.name(), Boolean.TRUE.equals(roleAccess.get(module.name())));
        }

        if (!MANAGED_ROLES.contains(user.getRole())) {
            return effective;
        }

        List<UserModuleOverride> overrides = userModuleOverrideRepository.findByUser_Id(user.getId());
        for (UserModuleOverride override : overrides) {
            effective.put(override.getModule().name(), Boolean.TRUE.equals(override.getAllowed()));
        }

        return effective;
    }

    private void ensureManagedRole(Role role) {
        if (!MANAGED_ROLES.contains(role)) {
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

    private Map<String, Map<String, Boolean>> createDefaultRoleMatrix() {
        Map<String, Map<String, Boolean>> matrix = new LinkedHashMap<>();

        for (Role role : MANAGED_ROLES) {
            Map<String, Boolean> roleMap = new LinkedHashMap<>();
            for (AccessModule module : AccessModule.values()) {
                boolean allowed = role == Role.CLIENT
                        ? module == AccessModule.DASHBOARD || module == AccessModule.CHAT
                        : true;

                roleMap.put(module.name(), allowed);
            }
            matrix.put(role.name(), roleMap);
        }

        return matrix;
    }
}
