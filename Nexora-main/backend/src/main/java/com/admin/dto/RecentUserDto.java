package com.admin.dto;


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
    private String role;
    private Boolean enabled;
    private String createdAt;
}