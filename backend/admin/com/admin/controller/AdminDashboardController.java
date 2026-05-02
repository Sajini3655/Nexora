package com.admin.controller;

import com.admin.dto.AdminDashboardResponse;
import com.admin.dto.AdminDashboardStatsResponse;
import com.admin.dto.RecentUserDto;
import com.admin.service.AdminDashboardService;
import com.admin.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getDashboardData() {
        try {
            AdminDashboardResponse response = adminDashboardService.getDashboardData();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", e.getClass().getName(),
                            "message", e.getMessage() == null ? "No message" : e.getMessage()
                    ));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            AdminDashboardStatsResponse response = adminDashboardService.getStats();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", e.getClass().getName(),
                            "message", e.getMessage() == null ? "No message" : e.getMessage()
                    ));
        }
    }

    @GetMapping("/recent-users")
    public ResponseEntity<?> getRecentUsers() {
        try {
            List<RecentUserDto> response = adminDashboardService.getRecentUsers();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", e.getClass().getName(),
                            "message", e.getMessage() == null ? "No message" : e.getMessage()
                    ));
        }
    }

    @GetMapping("/registrations-last-7-days")
    public ResponseEntity<?> getRegistrationsLast7Days() {
        try {
            return ResponseEntity.ok(adminDashboardService.getRegistrationsLast7Days());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", e.getClass().getName(),
                            "message", e.getMessage() == null ? "No message" : e.getMessage()
                    ));
        }
    }

    @GetMapping("/activity")
    public ResponseEntity<?> getRecentActivity() {
        try {
            return ResponseEntity.ok(auditLogService.getRecentActivity());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", e.getClass().getName(),
                            "message", e.getMessage() == null ? "No message" : e.getMessage()
                    ));
        }
    }
}