package com.admin.controller;

import com.admin.dto.TimesheetEntryDto;
import com.admin.dto.TimesheetEntryCreateRequest;
import com.admin.service.TimesheetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * DeveloperTimesheetController - Endpoints for developers to manage their timesheets
 * 
 * Routes:
 * - POST /api/developer/timesheets - Create new timesheet (draft)
 * - GET /api/developer/timesheets - Get own timesheets
 * - PATCH /api/developer/timesheets/{id}/submit - Submit timesheet for approval
 */
@RestController
@RequestMapping("/api/developer/timesheets")
@RequiredArgsConstructor
public class DeveloperTimesheetController {

    private final TimesheetService timesheetService;

    /**
     * Create a new draft timesheet entry
     */
    @PostMapping
    public ResponseEntity<TimesheetEntryDto> createTimesheet(
            @RequestBody TimesheetEntryCreateRequest request,
            Authentication authentication) {
        TimesheetEntryDto dto = timesheetService.createDraftTimesheet(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * Get all timesheets for the authenticated developer
     */
    @GetMapping
    public ResponseEntity<List<TimesheetEntryDto>> getMyTimesheets(
            Authentication authentication) {
        List<TimesheetEntryDto> dtos = timesheetService.getMyTimesheets(authentication);
        return ResponseEntity.ok(dtos);
    }

    /**
     * Submit a draft timesheet for approval
     */
    @PatchMapping("/{id}/submit")
    public ResponseEntity<TimesheetEntryDto> submitTimesheet(
            @PathVariable Long id,
            Authentication authentication) {
        TimesheetEntryDto dto = timesheetService.submitTimesheet(id, authentication);
        return ResponseEntity.ok(dto);
    }
}
