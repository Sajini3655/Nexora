package com.admin.dto;

import com.admin.entity.TaskPriority;
import com.admin.entity.TaskStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTaskResponse {

    private Long id;
    private String title;
    private TaskPriority priority;
    private TaskStatus status;
}