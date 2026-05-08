package com.admin.dto.nlq;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NlqResolveRequest {
    @NotBlank
    private String query;

    // Optional: frontend active workspace role (ADMIN|MANAGER|DEVELOPER|CLIENT)
    private String currentRole;
}
