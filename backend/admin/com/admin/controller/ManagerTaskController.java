package com.admin.controller;

import com.admin.dto.*;
import com.admin.service.TaskAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerTaskController {

    private final TaskAssignmentService taskAssignmentService;

    @GetMapping("/developers")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<List<DeveloperSummaryDto>> developers(Authentication authentication) {
        return ResponseEntity.ok(taskAssignmentService.listDevelopers(authentication.getName()));
    }

    @PostMapping("/tasks/suggest")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<SuggestAssigneeResponse> suggest(@Valid @RequestBody SuggestAssigneeRequest request) {
        return ResponseEntity.ok(taskAssignmentService.suggest(request));
    }

    @PostMapping("/tasks")
    public ResponseEntity<TaskDto> createTask(Authentication authentication, @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskAssignmentService.createTask(authentication.getName(), request));
    }

    @PatchMapping("/tasks/{taskId}/assignee")
    public ResponseEntity<TaskDto> assignTask(
            Authentication authentication,
            @PathVariable Long taskId,
            @RequestBody AssignTaskRequest request
    ) {
        return ResponseEntity.ok(taskAssignmentService.assignTask(authentication.getName(), taskId, request));
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDto>> listMyTasks(Authentication authentication) {
        return ResponseEntity.ok(taskAssignmentService.listManagerTasks(authentication.getName()));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDto> updateTaskDetails(
            Authentication authentication,
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        return ResponseEntity.ok(taskAssignmentService.updateTaskDetails(authentication.getName(), taskId, request));
    }

    @PatchMapping("/tasks/{taskId}/estimate")
    public ResponseEntity<TaskDto> updateTaskEstimate(
            Authentication authentication,
            @PathVariable Long taskId,
            @RequestBody Map<String, Object> payload
    ) {
        Object rawValue = payload == null ? null : payload.get("estimatedPoints");
        Integer estimatedPoints = 0;

        if (rawValue instanceof Number number) {
            estimatedPoints = number.intValue();
        } else if (rawValue != null) {
            estimatedPoints = Integer.parseInt(String.valueOf(rawValue));
        }

        return ResponseEntity.ok(taskAssignmentService.updateTaskEstimate(authentication.getName(), taskId, estimatedPoints));
    }
}
