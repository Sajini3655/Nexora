package com.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateRoleWithUserRequest {

    @NotBlank
    private String roleName;

    private String userName;

    @Email
    private String email;

    private String password;
}
