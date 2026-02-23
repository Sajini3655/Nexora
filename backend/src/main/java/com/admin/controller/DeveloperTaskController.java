package com.admin.controller;

import com.admin.dto.TaskDto;
import com.admin.dto.CreateSubtaskRequest;
import com.admin.dto.SubtaskDto;
import com.admin.dto.UpdateSubtaskRequest;
import com.admin.service.DeveloperSubtaskService;
import com.admin.service.DeveloperTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/developer/tasks")
@RequiredArgsConstructor
public class DeveloperTaskController {

    private final DeveloperTaskService developerTaskService;
    private final DeveloperSubtaskService developerSubtaskService;

    /** List tasks assigned to the authenticated developer. */
    @GetMapping
    public ResponseEntity<List<TaskDto>> myAssigned(Authentication authentication) {
        return ResponseEntity.ok(developerTaskService.listAssignedToMe(authentication.getName()));
    }

    /** Get a single task if it is assigned to the authenticated developer. */
    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> myTask(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(developerTaskService.getAssignedToMe(authentication.getName(), id));
    }

    // ---------------- Subtasks ----------------

    @GetMapping("/{id}/subtasks")
    public ResponseEntity<java.util.List<SubtaskDto>> listSubtasks(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(developerSubtaskService.listSubtasks(authentication.getName(), id));
    }

    @PostMapping("/{id}/subtasks")
    public ResponseEntity<SubtaskDto> createSubtask(Authentication authentication, @PathVariable Long id,
                                                   @Valid @RequestBody CreateSubtaskRequest request) {
        return ResponseEntity.ok(developerSubtaskService.createSubtask(authentication.getName(), id, request));
    }

    @PatchMapping("/{id}/subtasks/{subtaskId}")
    public ResponseEntity<SubtaskDto> updateSubtask(Authentication authentication, @PathVariable Long id,
                                                   @PathVariable Long subtaskId,
                                                   @Valid @RequestBody UpdateSubtaskRequest request) {
        return ResponseEntity.ok(developerSubtaskService.updateSubtask(authentication.getName(), id, subtaskId, request));
    }

    @DeleteMapping("/{id}/subtasks/{subtaskId}")
    public ResponseEntity<Void> deleteSubtask(Authentication authentication, @PathVariable Long id,
                                             @PathVariable Long subtaskId) {
        developerSubtaskService.deleteSubtask(authentication.getName(), id, subtaskId);
        return ResponseEntity.noContent().build();
    }
}
