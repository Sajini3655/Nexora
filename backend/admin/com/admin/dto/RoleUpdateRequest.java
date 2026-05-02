package com.admin.dto;

import com.admin.entity.Role;
import lombok.Data;

import java.util.Set;

@Data
public class RoleUpdateRequest {

    private Role role;

    private Set<Role> roles;
}
