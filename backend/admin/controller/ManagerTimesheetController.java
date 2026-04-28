package com.admin.controller;

import com.admin.dto.TimesheetEntryDto;
import com.admin.entity.TimesheetEntry;
import com.admin.service.TimesheetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ManagerTimesheetController - Endpoints for managers to review and approve timesheets
 * 
 * Routes:
 * - GET /api/manager/timesheets - Get submitted timesheets for team
 * - GET /api/manager/timesheets?projectId=X - Filter by project
 * - PATCH /api/manager/timesheets/{id}/approve - Approve a timesheet
 * - PATCH /api/manager/timesheets/{id}/reject - Reject a timesheet
 */
@RestController
@RequestMapping("/api/manager/timesheets")
@RequiredArgsConstructor
public class ManagerTimesheetController {

    private final TimesheetService timesheetService;

    /**
     * Get submitted timesheets for manager's projects
     */
    @GetMapping
    public ResponseEntity<List<TimesheetEntryDto>> getSubmittedTimesheets(
            @RequestParam(required = false) Long projectId,
            Authentication authentication) {
        List<TimesheetEntryDto> dtos = timesheetService.getSubmittedTimesheets(
                authentication,
                projectId
        );
        return ResponseEntity.ok(dtos);
    }

    /**
     * Approve a submitted timesheet
     */
    @PatchMapping("/{id}/approve")
    public ResponseEntity<TimesheetEntryDto> approveTimesheet(
            @PathVariable Long id,
            Authentication authentication) {
        TimesheetEntryDto dto = timesheetService.approveTimesheet(id, authentication);
        return ResponseEntity.ok(dto);
    }

    /**
     * Reject a submitted timesheet
     */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<TimesheetEntryDto> rejectTimesheet(
            @PathVariable Long id,
            @RequestParam String rejectionReason,
            Authentication authentication) {
        TimesheetEntryDto dto = timesheetService.rejectTimesheet(
                id,
                rejectionReason,
                authentication
        );
        return ResponseEntity.ok(dto);
    }
}
