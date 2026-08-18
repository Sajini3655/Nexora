package com.admin.dto;

public record ManagerClientResponse(
        Long id,
        String name,
        String email,
        String role
) {
}
