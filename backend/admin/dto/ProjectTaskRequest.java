package com.admin.dto;

import com.admin.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    @NotNull(message = "Task priority is required")
    private TaskPriority priority;
}