package com.admin.dto;

import com.admin.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RecentUserDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private Boolean enabled;
    private String createdAt;
}