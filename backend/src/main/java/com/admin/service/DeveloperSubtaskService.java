package com.admin.service;

import com.admin.dto.CreateSubtaskRequest;
import com.admin.dto.SubtaskDto;
import com.admin.dto.UpdateSubtaskRequest;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskSubtask;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.TaskRepository;
import com.admin.repository.TaskSubtaskRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeveloperSubtaskService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TaskSubtaskRepository subtaskRepository;

    @Transactional(readOnly = true)
    public List<SubtaskDto> listSubtasks(String developerEmail, Long taskId) {
        TaskItem task = requireAssignedTask(developerEmail, taskId);
        return subtaskRepository.findByTaskIdOrderByIdAsc(task.getId()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubtaskDto createSubtask(String developerEmail, Long taskId, CreateSubtaskRequest req) {
        TaskItem task = requireAssignedTask(developerEmail, taskId);
        TaskSubtask st = TaskSubtask.builder()
                .task(task)
                .title(req.getTitle().trim())
                .points(req.getPoints() == null ? 1 : req.getPoints())
                .done(false)
                .build();
        TaskSubtask saved = subtaskRepository.save(st);
        return toDto(saved);
    }

    @Transactional
    public SubtaskDto updateSubtask(String developerEmail, Long taskId, Long subtaskId, UpdateSubtaskRequest req) {
        TaskItem task = requireAssignedTask(developerEmail, taskId);
        TaskSubtask st = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));

        if (st.getTask() == null || st.getTask().getId() == null || !st.getTask().getId().equals(task.getId())) {
            throw new ResourceNotFoundException("Subtask not found");
        }

        if (req.getTitle() != null && !req.getTitle().trim().isEmpty()) {
            st.setTitle(req.getTitle().trim());
        }
        if (req.getPoints() != null && req.getPoints() > 0) {
            st.setPoints(req.getPoints());
        }
        if (req.getDone() != null) {
            st.setDone(req.getDone());
        }

        TaskSubtask saved = subtaskRepository.save(st);
        return toDto(saved);
    }

    @Transactional
    public void deleteSubtask(String developerEmail, Long taskId, Long subtaskId) {
        TaskItem task = requireAssignedTask(developerEmail, taskId);
        TaskSubtask st = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));
        if (st.getTask() == null || st.getTask().getId() == null || !st.getTask().getId().equals(task.getId())) {
            throw new ResourceNotFoundException("Subtask not found");
        }
        subtaskRepository.delete(st);
    }

    private TaskItem requireAssignedTask(String developerEmail, Long taskId) {
        User dev = userRepository.findByEmail(developerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Developer not found"));

        TaskItem task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (task.getAssignedTo() == null || task.getAssignedTo().getId() == null || !task.getAssignedTo().getId().equals(dev.getId())) {
            throw new ResourceNotFoundException("Task not found");
        }
        return task;
    }

    private SubtaskDto toDto(TaskSubtask s) {
        return SubtaskDto.builder()
                .id(s.getId())
                .title(s.getTitle())
                .points(s.getPoints())
                .done(s.isDone())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
