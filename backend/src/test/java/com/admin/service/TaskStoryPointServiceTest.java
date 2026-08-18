package com.admin.service;

import com.admin.dto.CreateTaskStoryPointRequest;
import com.admin.dto.TaskStoryPointDto;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.StoryPointStatus;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskStoryPoint;
import com.admin.entity.User;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskStoryPointServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskStoryPointRepository storyPointRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private LiveUpdatePublisher liveUpdatePublisher;

    @InjectMocks
    private TaskStoryPointService taskStoryPointService;

    @Test
    void createStoryPoint_shouldAllowExactEstimateBoundary() {
        User manager = User.builder()
                .id(7L)
                .email("manager@example.com")
                .name("Manager")
                .role(Role.MANAGER)
                .enabled(true)
                .build();

        Project project = Project.builder()
                .id(12L)
                .name("Project 12")
                .manager(manager)
                .build();

        TaskItem task = TaskItem.builder()
                .id(58L)
                .title("Task 58")
                .project(project)
                .createdBy(manager)
                .estimatedPoints(30)
                .status(com.admin.entity.TaskStatus.TODO)
                .build();

        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(taskRepository.findById(58L)).thenReturn(Optional.of(task));
        when(storyPointRepository.findByTaskIdOrderByCreatedAtAsc(58L)).thenReturn(List.of());
        when(storyPointRepository.save(any(TaskStoryPoint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskStoryPointDto result = taskStoryPointService.createStoryPoint(
                "manager@example.com",
                58L,
                CreateTaskStoryPointRequest.builder().title("Story 30").pointValue(30).build()
        );

        assertEquals(30, result.getPointValue());
        assertEquals("Story 30", result.getTitle());
    }

    @Test
    void createStoryPoint_shouldRejectValueAboveEstimate() {
        User manager = User.builder()
                .id(7L)
                .email("manager@example.com")
                .name("Manager")
                .role(Role.MANAGER)
                .enabled(true)
                .build();

        Project project = Project.builder()
                .id(12L)
                .name("Project 12")
                .manager(manager)
                .build();

        TaskItem task = TaskItem.builder()
                .id(58L)
                .title("Task 58")
                .project(project)
                .createdBy(manager)
                .estimatedPoints(30)
                .status(com.admin.entity.TaskStatus.TODO)
                .build();

        TaskStoryPoint existing = TaskStoryPoint.builder()
                .id(1L)
                .task(task)
                .title("Story 1")
                .pointValue(29)
                .status(StoryPointStatus.TODO)
                .completed(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(taskRepository.findById(58L)).thenReturn(Optional.of(task));
        when(storyPointRepository.findByTaskIdOrderByCreatedAtAsc(58L)).thenReturn(List.of(existing));

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> taskStoryPointService.createStoryPoint(
                        "manager@example.com",
                        58L,
                        CreateTaskStoryPointRequest.builder().title("Story 2").pointValue(2).build()
                )
        );

        assertEquals("This story point would exceed the task estimate of 30 points. Current total: 29. Remaining budget: 1 point(s).", ex.getMessage());
    }
}
