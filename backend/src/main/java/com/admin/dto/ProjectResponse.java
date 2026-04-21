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
    private Instant createdAt;
    private List<ProjectTaskResponse> tasks;
}