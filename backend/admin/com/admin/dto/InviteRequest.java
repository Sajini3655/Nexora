package com.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Set;

@Data
public class InviteRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    // Role names may be built-in (ADMIN/MANAGER/DEVELOPER/CLIENT) or custom
    // roles defined in Access Control, so they are accepted as raw strings.
    private String role;

    private Set<String> roles;
}
