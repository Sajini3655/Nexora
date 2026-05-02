package com.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserOverridesUpdateRequest {

    @NotNull
    private Long userId;

    @NotNull
    private Map<String, Boolean> overrides;
}
