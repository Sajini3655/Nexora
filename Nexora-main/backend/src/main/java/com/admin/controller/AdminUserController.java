package com.admin.controller;

import com.admin.dto.InviteRequest;
import com.admin.dto.PageResponse;
import com.admin.dto.RoleUpdateRequest;
import com.admin.dto.StatusUpdateRequest;
import com.admin.dto.UserResponse;
import com.admin.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<PageResponse<UserResponse>> getUsers(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "enabled", required = false) Boolean enabled,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(userService.getUsers(q, role, enabled, page, size));
    }

    @PostMapping("/invite")
    public ResponseEntity<Map<String, String>> inviteUser(@Valid @RequestBody InviteRequest request) {
        return ResponseEntity.ok(userService.inviteUser(request));
    }

    @PostMapping("/{id}/resend-invite")
    public ResponseEntity<Map<String, String>> resendInvite(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userService.resendInvite(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> updateUserStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        userService.updateUserStatus(id, request.getEnabled());

        String message = Boolean.TRUE.equals(request.getEnabled())
                ? "User enabled successfully."
                : "User disabled successfully.";

        return ResponseEntity.ok(Map.of("message", message));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<Map<String, String>> updateUserRole(
            @PathVariable("id") Long id,
            @Valid @RequestBody RoleUpdateRequest request
    ) {
        String message = userService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(Map.of("message", message));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable("id") Long id) {
        String message = userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", message));
    }
}