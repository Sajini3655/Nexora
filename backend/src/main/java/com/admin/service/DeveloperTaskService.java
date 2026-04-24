package com.admin.service;

import com.admin.dto.TaskDto;
import com.admin.entity.TaskItem;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.TaskRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeveloperTaskService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<TaskDto> listAssignedToMe(String developerEmail) {
        User dev = userRepository.findByEmail(developerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Developer not found"));

        return taskRepository.findByAssignedToId(dev.getId()).stream()
                .sorted(Comparator.comparing(TaskItem::getCreatedAt).reversed())
                .map(this::toTaskDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskDto getAssignedToMe(String developerEmail, Long taskId) {
        User dev = userRepository.findByEmail(developerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Developer not found"));

        TaskItem task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (task.getAssignedTo() == null || task.getAssignedTo().getId() == null || !task.getAssignedTo().getId().equals(dev.getId())) {
            // Hide tasks not assigned to this developer.
            throw new ResourceNotFoundException("Task not found");
        }

        return toTaskDto(task);
    }

    private TaskDto toTaskDto(TaskItem t) {
        return TaskDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus())
                .priority(t.getPriority())
                .dueDate(t.getDueDate())
                .estimatedPoints(t.getEstimatedPoints())
                .createdById(t.getCreatedBy() == null ? null : t.getCreatedBy().getId())
                .assignedToId(t.getAssignedTo() == null ? null : t.getAssignedTo().getId())
                .assignedToName(t.getAssignedTo() == null ? null : t.getAssignedTo().getName())
                .createdAt(t.getCreatedAt())
                .projectId(t.getProject() == null ? null : t.getProject().getId())
                .projectName(t.getProject() == null ? null : t.getProject().getName())
                .build();
    }
}
