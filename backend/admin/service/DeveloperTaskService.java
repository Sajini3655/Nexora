package com.admin.service;

import com.admin.dto.TaskDto;
import com.admin.entity.TaskItem;
import com.admin.entity.StoryPointStatus;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.TaskRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeveloperTaskService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TaskStoryPointRepository storyPointRepository;

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

        TaskItem task = taskRepository.findById(Objects.requireNonNull(taskId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (task.getAssignedTo() == null || task.getAssignedTo().getId() == null || !task.getAssignedTo().getId().equals(dev.getId())) {
            // Hide tasks not assigned to this developer.
            throw new ResourceNotFoundException("Task not found");
        }

        return toTaskDto(task);
    }

    private TaskDto toTaskDto(TaskItem t) {
        long totalStoryPoints = storyPointRepository.countByTaskId(t.getId());
        long completedStoryPoints = storyPointRepository.countByTaskIdAndStatus(t.getId(), StoryPointStatus.DONE);
        long totalPointValue = storyPointRepository.findByTaskIdOrderByCreatedAtAsc(t.getId()).stream()
            .mapToLong(point -> point.getPointValue() == null ? 0 : point.getPointValue())
            .sum();
        long completedPointValue = storyPointRepository.findByTaskIdOrderByCreatedAtAsc(t.getId()).stream()
            .filter(point -> point.getStatus() == StoryPointStatus.DONE)
            .mapToLong(point -> point.getPointValue() == null ? 0 : point.getPointValue())
            .sum();
        int progressPercentage = totalPointValue > 0
            ? (int) Math.round((completedPointValue * 100.0) / totalPointValue)
            : (totalStoryPoints == 0 ? 0 : (int) Math.round((completedStoryPoints * 100.0) / totalStoryPoints));

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
                .totalStoryPoints(totalStoryPoints)
                .completedStoryPoints(completedStoryPoints)
                .totalPointValue(totalPointValue)
                .completedPointValue(completedPointValue)
                .progressPercentage(progressPercentage)
                .build();
    }
}
