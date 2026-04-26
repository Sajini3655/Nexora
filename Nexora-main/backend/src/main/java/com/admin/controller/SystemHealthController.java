package com.admin.controller;

import com.admin.dto.SystemHealthResponse;
import com.admin.service.SystemHealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class SystemHealthController {

    private final SystemHealthService systemHealthService;

    @GetMapping("/system-health")
    public ResponseEntity<?> getSystemHealth() {
        try {
            SystemHealthResponse response = systemHealthService.getSystemHealth();
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
}