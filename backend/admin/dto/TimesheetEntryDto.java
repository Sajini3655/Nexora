package com.admin.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * TimesheetEntryDto - Data transfer object for timesheet entries
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetEntryDto {
    private Long id;
    private Long developerId;
    private String developerName;
    private Long projectId;
    private String projectName;
    private Long taskId;
    private String taskName;
    private LocalDate workDate;
    private Double hoursWorked;
    private String description;
    private String status; // DRAFT, SUBMITTED, APPROVED, REJECTED
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
