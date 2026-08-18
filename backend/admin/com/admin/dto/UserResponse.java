package com.admin.dto;

import com.admin.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;

    private String name;

    private String email;

    private Role role;

    private List<Role> roles;

    // Custom (admin-defined) roles assigned to this user, by name.
    private List<String> customRoles;

    // All assigned role names: built-in enum names plus custom role names.
    private List<String> roleNames;

    private Boolean enabled;

    private LocalDateTime createdAt;
}
