package com.admin.dto;

import com.admin.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaskRequest {

    @NotBlank
    private String title;

    private String description;

    private TaskPriority priority;

    private LocalDate dueDate;

    private Integer estimatedPoints;

    private Long assignedToId; // optional
}
