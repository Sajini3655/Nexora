package com.admin.dto;

import com.admin.entity.Role;
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

    private Role role;

    private Set<Role> roles;
}
