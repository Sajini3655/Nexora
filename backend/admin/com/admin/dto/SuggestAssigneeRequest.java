package com.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestAssigneeRequest {
    @NotBlank
    private String title;
    private String description;
    private Integer estimatedPoints;
}
