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
 * AdminTimesheetController - Endpoints for admins to view all timesheets
 * 
 * Routes:
 * - GET /api/admin/timesheets - Get all timesheets with optional filters
 * - GET /api/admin/timesheets?userId=X&projectId=Y&status=Z&dateFrom=A&dateTo=B
 */
@RestController
@RequestMapping("/api/admin/timesheets")
@RequiredArgsConstructor
public class AdminTimesheetController {

    private final TimesheetService timesheetService;

    /**
     * Get all timesheets with optional filters
     * 
     * Query parameters:
     * - developerId: Filter by developer
     * - projectId: Filter by project
     * - status: Filter by status (DRAFT, SUBMITTED, APPROVED, REJECTED)
     * - dateFrom: Filter from date
     * - dateTo: Filter to date
     * - page: Page number (0-indexed)
     * - size: Page size
     */
    @GetMapping
    public ResponseEntity<Page<TimesheetEntryDto>> getTimesheets(
            @RequestParam(required = false) Long developerId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        TimesheetEntry.TimesheetStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            try {
                statusEnum = TimesheetEntry.TimesheetStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<TimesheetEntryDto> dtos = timesheetService.getAllTimesheets(
                developerId,
                projectId,
                statusEnum,
                dateFrom,
                dateTo,
                pageable
        );

        return ResponseEntity.ok(dtos);
    }
}
