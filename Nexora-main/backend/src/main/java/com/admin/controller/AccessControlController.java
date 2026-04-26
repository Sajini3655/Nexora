package com.admin.controller;

import com.admin.dto.CreateRoleWithUserRequest;
import com.admin.dto.RoleDto;
import com.admin.entity.RoleDefinition;
import com.admin.entity.RolePermission;
import com.admin.repository.RoleDefinitionRepository;
import com.admin.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/access")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AccessControlController {

    private final RoleDefinitionRepository roleRepository;
    private final UserService userService;

    @GetMapping("/roles")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<RoleDto>> getAllRoles() {
        List<RoleDto> roles = roleRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roles);
    }

    @PostMapping("/roles")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<RoleDto> createRole(@RequestBody String roleName) {
        // Remove quotes if present from JSON body
        String name = roleName.replace("\"", "").trim();
        
        if (roleRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Role already exists");
        }

        RoleDefinition role = RoleDefinition.builder()
                .name(name.toUpperCase())
                .systemRole(false)
                .build();

        // Initialize default permissions (all off by default for new roles)
        String[] modules = {"DASHBOARD", "TASKS", "CHAT", "FILES", "REPORTS"};
        for (String m : modules) {
            role.getPermissions().add(RolePermission.builder()
                    .role(role)
                    .moduleKey(m)
                    .canAccess(false)
                    .build());
        }

        RoleDefinition saved = roleRepository.save(role);
        return ResponseEntity.ok(toDto(saved));
    }

    @PostMapping("/roles-with-user")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<RoleDto> createRoleWithUser(@Valid @RequestBody CreateRoleWithUserRequest request) {
        RoleDefinition saved = userService.createRoleWithUser(request);
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/roles/{id}/permissions")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<RoleDto> updatePermissions(
            @PathVariable Long id,
            @RequestBody List<RoleDto.PermissionDto> permissionDtos) {
        
        RoleDefinition role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        for (RoleDto.PermissionDto dto : permissionDtos) {
            role.getPermissions().stream()
                    .filter(p -> p.getModuleKey().equals(dto.getModuleKey()))
                    .findFirst()
                    .ifPresent(p -> p.setCanAccess(dto.isCanAccess()));
        }

        RoleDefinition saved = roleRepository.save(role);
        return ResponseEntity.ok(toDto(saved));
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        RoleDefinition role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        
        if (role.isSystemRole()) {
            throw new RuntimeException("Cannot delete system roles");
        }

        roleRepository.delete(role);
        return ResponseEntity.noContent().build();
    }

    private RoleDto toDto(RoleDefinition role) {
        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .systemRole(role.isSystemRole())
                .permissions(role.getPermissions().stream()
                        .map(p -> RoleDto.PermissionDto.builder()
                                .moduleKey(p.getModuleKey())
                                .canAccess(p.isCanAccess())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
