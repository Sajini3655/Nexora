package com.admin.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * TimesheetEntryCreateRequest - Request to create or submit a timesheet
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetEntryCreateRequest {
    private Long projectId; // Required
    private Long taskId; // Optional
    private LocalDate workDate; // Required
    private Double hoursWorked; // Required, must be > 0
    private String description; // Optional
}
