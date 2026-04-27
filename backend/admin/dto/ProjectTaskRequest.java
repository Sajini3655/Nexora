package com.admin.dto;

import com.admin.entity.TaskPriority;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    @NotNull(message = "Task priority is required")
    private TaskPriority priority;

    private String dueDate;

    @Valid
    private List<CreateTaskStoryPointRequest> storyPoints;
}