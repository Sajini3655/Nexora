package com.admin.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectProgressResponse {
    private Long projectId;
    private String projectName;
    private long totalTasks;
    private long completedTasks;
    private long totalStoryPoints;
    private long completedStoryPoints;
    private long totalPointValue;
    private long completedPointValue;
    private int progressPercentage;
}
