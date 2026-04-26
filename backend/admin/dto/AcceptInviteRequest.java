package com.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AcceptInviteRequest {

    @NotBlank(message = "Token is required")
    private String token;

    @NotBlank(message = "Password is required")
    private String password;
}