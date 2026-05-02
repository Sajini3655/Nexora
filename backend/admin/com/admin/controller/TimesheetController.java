package com.admin.controller;

import com.admin.dto.CreateTimesheetRequest;
import com.admin.dto.RejectTimesheetRequest;
import com.admin.dto.TimesheetOptionsResponse;
import com.admin.dto.TimesheetResponse;
import com.admin.dto.TimesheetSummaryResponse;
import com.admin.dto.UpdateTimesheetRequest;
import com.admin.service.TimesheetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/timesheets")
@RequiredArgsConstructor
public class TimesheetController {

    private final TimesheetService timesheetService;

    @GetMapping("/my")
    public ResponseEntity<List<TimesheetResponse>> getMyTimesheets(Authentication authentication) {
        return ResponseEntity.ok(timesheetService.getMyTimesheets(authentication));
    }

    @GetMapping("/my/summary")
    public ResponseEntity<TimesheetSummaryResponse> getMySummary(Authentication authentication) {
        return ResponseEntity.ok(timesheetService.getMySummary(authentication));
    }

    @GetMapping("/options")
    public ResponseEntity<TimesheetOptionsResponse> getOptions(Authentication authentication) {
        return ResponseEntity.ok(timesheetService.getMyOptions(authentication));
    }

    @PostMapping
    public ResponseEntity<TimesheetResponse> create(
            @Valid @RequestBody CreateTimesheetRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(timesheetService.createTimesheet(request, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimesheetResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTimesheetRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(timesheetService.updateTimesheet(id, request, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        timesheetService.deleteTimesheet(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/submit")
    public ResponseEntity<TimesheetResponse> submit(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(timesheetService.submitTimesheet(id, authentication));
    }

    @GetMapping("/team")
    public ResponseEntity<List<TimesheetResponse>> getTeamTimesheets(
            Authentication authentication,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(timesheetService.getTeamTimesheets(authentication, status));
    }

    @GetMapping("/team/summary")
    public ResponseEntity<TimesheetSummaryResponse> getTeamSummary(Authentication authentication) {
        return ResponseEntity.ok(timesheetService.getTeamSummary(authentication));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<TimesheetResponse> approve(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(timesheetService.approveTimesheet(id, authentication));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<TimesheetResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectTimesheetRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(timesheetService.rejectTimesheet(id, request, authentication));
    }

    @GetMapping("/admin")
    public ResponseEntity<List<TimesheetResponse>> getAdminTimesheets(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long developerId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return ResponseEntity.ok(timesheetService.getAdminTimesheets(authentication, status, developerId, projectId, fromDate, toDate));
    }

    @GetMapping("/admin/summary")
    public ResponseEntity<TimesheetSummaryResponse> getAdminSummary(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long developerId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return ResponseEntity.ok(timesheetService.getAdminSummary(authentication, status, developerId, projectId, fromDate, toDate));
    }
}
