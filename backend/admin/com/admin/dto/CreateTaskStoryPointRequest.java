package com.admin.dto;

import jakarta.validation.constraints.Min;
// title is optional now; no NotBlank validation
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaskStoryPointRequest {

    private String title;

    private String description;

    @NotNull
    @Min(1)
    private Integer pointValue;
}
