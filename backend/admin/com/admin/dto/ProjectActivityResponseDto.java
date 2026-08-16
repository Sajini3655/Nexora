package com.admin.dto;

import com.admin.entity.ActivityType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectActivityResponseDto {
    private Long id;
    private Long projectId;
    private String projectName;
    private ActivityType activityType;
    private String title;
    private String description;
    private String performedBy;
    private LocalDateTime createdAt;
}
