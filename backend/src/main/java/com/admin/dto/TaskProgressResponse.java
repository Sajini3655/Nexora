package com.admin.dto;

import com.admin.entity.TaskStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskProgressResponse {
    private Long taskId;
    private long totalStoryPoints;
    private long completedStoryPoints;
    private long totalPointValue;
    private long completedPointValue;
    private int progressPercentage;
    private TaskStatus status;
}
