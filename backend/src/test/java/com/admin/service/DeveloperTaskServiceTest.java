package com.admin.service;

import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.StoryPointStatus;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskStatus;
import com.admin.entity.User;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeveloperTaskServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskStoryPointRepository storyPointRepository;

    @InjectMocks
    private DeveloperTaskService developerTaskService;

    @Test
    void getAssignedTaskCalculatesStoryPointProgress() {
        User developer = User.builder().id(7L).name("Developer").email("developer@example.com")
                .role(Role.DEVELOPER).enabled(true).build();
        Project project = Project.builder().id(12L).name("Portal").build();
        TaskItem task = TaskItem.builder().id(21L).title("Build page").project(project)
                .assignedTo(developer).status(TaskStatus.TODO).createdAt(LocalDateTime.now()).build();

        when(userRepository.findByEmail("developer@example.com")).thenReturn(Optional.of(developer));
        when(taskRepository.findById(21L)).thenReturn(Optional.of(task));
        when(storyPointRepository.countByTaskId(21L)).thenReturn(2L);
        when(storyPointRepository.countByTaskIdAndStatus(21L, StoryPointStatus.DONE)).thenReturn(1L);
        when(storyPointRepository.findByTaskIdOrderByCreatedAtAsc(21L)).thenReturn(List.of());

        var result = developerTaskService.getAssignedToMe("developer@example.com", 21L);

        assertEquals(21L, result.getId());
        assertEquals("Build page", result.getTitle());
        assertEquals(50, result.getProgressPercentage());
    }

    @Test
    void getAssignedTaskHidesTaskBelongingToAnotherDeveloper() {
        User developer = User.builder().id(7L).email("developer@example.com").role(Role.DEVELOPER).build();
        User otherDeveloper = User.builder().id(8L).email("other@example.com").role(Role.DEVELOPER).build();
        TaskItem task = TaskItem.builder().id(21L).title("Private task").assignedTo(otherDeveloper).build();

        when(userRepository.findByEmail("developer@example.com")).thenReturn(Optional.of(developer));
        when(taskRepository.findById(21L)).thenReturn(Optional.of(task));

        assertThrows(
                com.admin.exception.ResourceNotFoundException.class,
                () -> developerTaskService.getAssignedToMe("developer@example.com", 21L)
        );
    }

    @Test
    void projectTasksRequireDeveloperProjectAccess() {
        User developer = User.builder().id(7L).email("developer@example.com").role(Role.DEVELOPER).build();
        when(userRepository.findByEmail("developer@example.com")).thenReturn(Optional.of(developer));
        when(taskRepository.existsByProject_IdAndAssignedTo_Id(12L, 7L)).thenReturn(false);

        assertThrows(
                com.admin.exception.ResourceNotFoundException.class,
                () -> developerTaskService.listProjectTasksVisibleToMe("developer@example.com", 12L)
        );
    }
}
