package com.admin.dto;

import lombok.*;

/**
 * TimesheetApprovalRequest - Request to approve or reject a timesheet
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetApprovalRequest {
    private Long timesheetId;
    private String rejectionReason; // Optional, used only for rejection
}
