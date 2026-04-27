package com.admin.dto;

import com.admin.entity.StoryPointStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskStoryPointDto {
    private Long id;
    private Long taskId;
    private String title;
    private String description;
    private Integer pointValue;
    private StoryPointStatus status;
    private Boolean completed;
    private LocalDateTime completedAt;
    private Long completedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
