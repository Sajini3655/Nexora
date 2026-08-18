package com.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaskStoryPointRequest {

    private String title;

    @NotNull
    @Min(1)
    private Integer pointValue;
}

