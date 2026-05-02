package com.admin.controller;

import com.admin.dto.TaskDto;
import com.admin.service.DeveloperTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/developer/tasks")
@RequiredArgsConstructor
public class DeveloperTaskController {

    private final DeveloperTaskService developerTaskService;

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

    /** List all tasks in a project if developer is assigned to at least one task in that project. */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskDto>> projectTasks(Authentication authentication, @PathVariable Long projectId) {
        return ResponseEntity.ok(developerTaskService.listProjectTasksVisibleToMe(authentication.getName(), projectId));
    }
}
