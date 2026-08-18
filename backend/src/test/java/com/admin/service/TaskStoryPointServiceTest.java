package com.admin.service;

import com.admin.dto.CreateTaskStoryPointRequest;
import com.admin.dto.TaskStoryPointDto;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.StoryPointStatus;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskStoryPoint;
import com.admin.entity.Ticket;
import com.admin.entity.User;
import com.admin.repository.ChatMessageRepository;
import com.admin.repository.ChatSessionRepository;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.TimesheetEntryRepository;
import com.admin.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskStoryPointServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskStoryPointRepository taskStoryPointRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private LiveUpdatePublisher liveUpdatePublisher;

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private TimesheetEntryRepository timesheetEntryRepository;

    @Mock
    private ProjectFileService projectFileService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private TaskStoryPointService taskStoryPointService;

    @InjectMocks
    private ProjectService projectService;

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
        when(taskStoryPointRepository.findByTaskIdOrderByCreatedAtAsc(58L)).thenReturn(List.of());
        when(taskStoryPointRepository.save(any(TaskStoryPoint.class))).thenAnswer(invocation -> invocation.getArgument(0));

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
        when(taskStoryPointRepository.findByTaskIdOrderByCreatedAtAsc(58L)).thenReturn(List.of(existing));

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

    @Test
    void deleteProject_shouldDeleteTicketsLinkedToTasksInsideTheProject() throws Exception {
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
                .status(com.admin.entity.TaskStatus.TODO)
                .build();

        Ticket projectTicket = Ticket.builder()
                .id(100L)
                .title("Project ticket")
                .project(project)
                .build();

        Ticket taskTicket = Ticket.builder()
                .id(101L)
                .title("Task ticket")
                .assignedTask(task)
                .build();

        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("manager@example.com");
        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(projectRepository.findById(12L)).thenReturn(Optional.of(project));
        when(taskRepository.findByProject_Id(12L)).thenReturn(List.of(task));
        when(chatSessionRepository.findByProject_IdOrderByStartedAtDesc(12L)).thenReturn(List.of());
        when(ticketRepository.findAll()).thenReturn(List.of(projectTicket, taskTicket));
        when(timesheetEntryRepository.findAll()).thenReturn(List.of());
        when(taskStoryPointRepository.findAll()).thenReturn(List.of());
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(Map.of("table_name", "project_activity", "column_name", "project_id")));
        doNothing().when(projectFileService).deleteAllProjectFiles(12L);

        String result = projectService.deleteProject(12L, authentication);

        assertEquals("Project deleted successfully.", result);

        ArgumentCaptor<java.util.List<Ticket>> ticketsCaptor = ArgumentCaptor.forClass(java.util.List.class);
        verify(ticketRepository).deleteAll(ticketsCaptor.capture());
        java.util.List<Ticket> deletedTickets = ticketsCaptor.getValue();
        assertEquals(2, deletedTickets.size());
        assertEquals(List.of(100L, 101L), deletedTickets.stream().map(Ticket::getId).toList());
        verify(jdbcTemplate).update("DELETE FROM project_activity WHERE project_id = ?", 12L);
    }
}
