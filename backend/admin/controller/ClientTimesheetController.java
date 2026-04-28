package com.admin.controller;

import com.admin.dto.TimesheetEntryDto;
import com.admin.entity.TimesheetEntry;
import com.admin.service.TimesheetService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * ClientTimesheetController - Read-only endpoints for clients to view approved timesheets
 * 
 * Routes:
 * - GET /api/client/timesheets - Get approved timesheets for client's projects
 * - GET /api/client/timesheets?projectId=X&dateFrom=A&dateTo=B
 * 
 * Clients can only see APPROVED timesheets for their projects.
 */
@RestController
@RequestMapping("/api/client/timesheets")
@RequiredArgsConstructor
public class ClientTimesheetController {

    private final TimesheetService timesheetService;

    /**
     * Get approved timesheets for client's projects
     * 
     * Query parameters:
     * - projectId: Filter by project (optional)
     * - dateFrom: Filter from date (optional)
     * - dateTo: Filter to date (optional)
     * - page: Page number (0-indexed)
     * - size: Page size
     * 
     * Note: Only returns APPROVED timesheets
     */
    @GetMapping
    public ResponseEntity<Page<TimesheetEntryDto>> getApprovedTimesheets(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<TimesheetEntryDto> dtos = timesheetService.getAllTimesheets(
                null, // No developer filter
                projectId,
                TimesheetEntry.TimesheetStatus.APPROVED, // Only approved
                dateFrom,
                dateTo,
                pageable
        );

        return ResponseEntity.ok(dtos);
    }
}
