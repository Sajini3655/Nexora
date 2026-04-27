package com.admin.dto;

import com.admin.entity.TaskPriority;
import com.admin.entity.TaskStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDto {
    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
    private Integer estimatedPoints;
    private Long createdById;
    private Long assignedToId;
    private String assignedToName;
    private LocalDateTime createdAt;

    private Long projectId;
    private String projectName;

    private Long totalStoryPoints;
    private Long completedStoryPoints;
    private Long totalPointValue;
    private Long completedPointValue;
    private Integer progressPercentage;
}