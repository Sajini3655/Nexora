package com.admin.controller;

import com.admin.dto.AccessModuleDto;
import com.admin.dto.AccessUserDto;
import com.admin.dto.UserOverridesUpdateRequest;
import com.admin.service.AccessControlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/access")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AccessControlController {

    private final AccessControlService accessControlService;

    @GetMapping("/modules")
    public ResponseEntity<List<AccessModuleDto>> getModules() {
        return ResponseEntity.ok(accessControlService.getModules());
    }

    @GetMapping("/roles")
    public ResponseEntity<List<String>> getRoles() {
        return ResponseEntity.ok(accessControlService.getRoles());
    }

    @GetMapping("/role-matrix")
    public ResponseEntity<Map<String, Map<String, Boolean>>> getRoleMatrix() {
        return ResponseEntity.ok(accessControlService.getRoleMatrix());
    }

    @PutMapping("/role-matrix")
    public ResponseEntity<Map<String, Map<String, Boolean>>> saveRoleMatrix(
            @RequestBody Map<String, Map<String, Boolean>> payload
    ) {
        return ResponseEntity.ok(accessControlService.saveRoleMatrix(payload));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AccessUserDto>> getUsers(
            @RequestParam(name = "role", required = false) String role
    ) {
        return ResponseEntity.ok(accessControlService.getUsers(role));
    }

    @GetMapping("/user-overrides")
    public ResponseEntity<Map<String, Boolean>> getUserOverrides(
            @RequestParam("userId") Long userId
    ) {
        return ResponseEntity.ok(accessControlService.getUserOverrides(userId));
    }

    @PutMapping("/user-overrides")
    public ResponseEntity<Map<String, Boolean>> saveUserOverrides(
            @Valid @RequestBody UserOverridesUpdateRequest request
    ) {
        return ResponseEntity.ok(accessControlService.saveUserOverrides(request));
    }
}
