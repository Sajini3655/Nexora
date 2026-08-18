package com.admin.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private Long managerId;
    private String managerName;
    private Long clientId;
    private String clientName;
    private String clientEmail;
    private Instant createdAt;
    private Integer totalTasks;
    private Integer completedTasks;
    private Integer progressPercentage;
    private List<ProjectTaskResponse> tasks;
}