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

    
    @GetMapping
    public ResponseEntity<List<TaskDto>> myAssigned(Authentication authentication) {
        return ResponseEntity.ok(developerTaskService.listAssignedToMe(authentication.getName()));
    }

    
    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> myTask(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(developerTaskService.getAssignedToMe(authentication.getName(), id));
    }

    
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskDto>> projectTasks(Authentication authentication, @PathVariable Long projectId) {
        return ResponseEntity.ok(developerTaskService.listProjectTasksVisibleToMe(authentication.getName(), projectId));
    }
}

