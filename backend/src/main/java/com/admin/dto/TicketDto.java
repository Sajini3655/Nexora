package com.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDto {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private Long projectId;
    private String projectName;
    private Long assignedTaskId;
    private Long managerId;
    private Long clientId;
    private Long createdById;
    private String createdByName;
    private Long assignedToId;
    private String assignedToName;
    private String sourceChannel;
    private String sourceEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}