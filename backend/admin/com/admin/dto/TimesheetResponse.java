package com.admin.dto;

import com.admin.entity.TimesheetStatus;
import com.admin.entity.WorkLocation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetResponse {

    private Long id;
    private Long developerId;
    private String developerName;
    private Long projectId;
    private String projectName;
    private Long taskId;
    private String taskTitle;
    private LocalDate workDate;
    private BigDecimal hours;
    private String description;
    private WorkLocation workLocation;
    private TimesheetStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String reviewedByName;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}