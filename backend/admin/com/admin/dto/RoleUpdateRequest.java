package com.admin.dto;

import lombok.Data;

import java.util.Set;

@Data
public class RoleUpdateRequest {

    // Role names may be built-in (ADMIN/MANAGER/DEVELOPER/CLIENT) or custom
    // roles defined in Access Control, so they are accepted as raw strings.
    private String role;

    private Set<String> roles;
}
