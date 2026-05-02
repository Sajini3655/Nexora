package com.admin.controller;

import com.admin.dto.*;
import com.admin.service.TaskStoryPointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TaskStoryPointController {

    private final TaskStoryPointService taskStoryPointService;

    @PostMapping("/api/tasks/{taskId}/story-points")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<TaskStoryPointDto> createStoryPoint(
            Authentication authentication,
            @PathVariable Long taskId,
            @Valid @RequestBody CreateTaskStoryPointRequest request
    ) {
        return ResponseEntity.ok(taskStoryPointService.createStoryPoint(authentication.getName(), taskId, request));
    }

    @GetMapping("/api/tasks/{taskId}/story-points")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER')")
    public ResponseEntity<List<TaskStoryPointDto>> getTaskStoryPoints(
            Authentication authentication,
            @PathVariable Long taskId
    ) {
        return ResponseEntity.ok(taskStoryPointService.getStoryPointsByTask(authentication.getName(), taskId));
    }

    @PutMapping("/api/story-points/{storyPointId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<TaskStoryPointDto> updateStoryPoint(
            Authentication authentication,
            @PathVariable Long storyPointId,
            @Valid @RequestBody UpdateTaskStoryPointRequest request
    ) {
        return ResponseEntity.ok(taskStoryPointService.updateStoryPoint(authentication.getName(), storyPointId, request));
    }

    @DeleteMapping("/api/story-points/{storyPointId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteStoryPoint(
            Authentication authentication,
            @PathVariable Long storyPointId
    ) {
        taskStoryPointService.deleteStoryPoint(authentication.getName(), storyPointId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/story-points/{storyPointId}/done")
    @PreAuthorize("hasRole('DEVELOPER')")
    public ResponseEntity<TaskStoryPointDto> markDone(
            Authentication authentication,
            @PathVariable Long storyPointId
    ) {
        return ResponseEntity.ok(taskStoryPointService.markStoryPointDone(authentication.getName(), storyPointId));
    }

    @PatchMapping("/api/story-points/{storyPointId}/todo")
    @PreAuthorize("hasRole('DEVELOPER')")
    public ResponseEntity<TaskStoryPointDto> markTodo(
            Authentication authentication,
            @PathVariable Long storyPointId
    ) {
        return ResponseEntity.ok(taskStoryPointService.markStoryPointTodo(authentication.getName(), storyPointId));
    }

    @GetMapping("/api/tasks/{taskId}/progress")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER')")
    public ResponseEntity<TaskProgressResponse> taskProgress(
            Authentication authentication,
            @PathVariable Long taskId
    ) {
        return ResponseEntity.ok(taskStoryPointService.calculateTaskProgress(authentication.getName(), taskId));
    }

    @GetMapping("/api/developers/{developerId}/progress")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER')")
    public ResponseEntity<DeveloperProgressResponse> developerProgress(
            Authentication authentication,
            @PathVariable Long developerId
    ) {
        return ResponseEntity.ok(taskStoryPointService.calculateDeveloperProgress(authentication.getName(), developerId));
    }

    @GetMapping("/api/projects/{projectId}/progress")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER')")
    public ResponseEntity<ProjectProgressResponse> projectProgress(
            Authentication authentication,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(taskStoryPointService.calculateProjectProgress(authentication.getName(), projectId));
    }
}
