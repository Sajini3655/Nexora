package com.admin.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeveloperProgressResponse {
    private Long developerId;
    private String developerName;
    private long assignedTasks;
    private long completedTasks;
    private long inProgressTasks;
    private long totalStoryPoints;
    private long completedStoryPoints;
    private long totalPointValue;
    private long completedPointValue;
    private int averageProgress;
}
