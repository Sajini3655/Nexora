package com.admin.service;

import com.admin.dto.CreateTimesheetRequest;
import com.admin.dto.RejectTimesheetRequest;
import com.admin.dto.TimesheetOptionsResponse;
import com.admin.dto.TimesheetResponse;
import com.admin.dto.TimesheetSummaryResponse;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskStatus;
import com.admin.entity.TimesheetEntry;
import com.admin.entity.TimesheetStatus;
import com.admin.entity.User;
import com.admin.entity.WorkLocation;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TimesheetEntryRepository;
import com.admin.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimesheetServiceTest {

    @Mock
    private TimesheetEntryRepository timesheetEntryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TimesheetService timesheetService;

    @Test
    void createDraft_trimsDescriptionAndNormalizesHours() {
        User developer = developer(7L);
        Project project = project(12L, developer);
        Authentication authentication = authentication("developer@example.com");
        when(userRepository.findByEmail("developer@example.com")).thenReturn(Optional.of(developer));
        when(projectRepository.findById(12L)).thenReturn(Optional.of(project));
        when(taskRepository.existsByProject_IdAndAssignedTo_Id(12L, 7L)).thenReturn(true);
        when(timesheetEntryRepository.save(any(TimesheetEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TimesheetResponse response = timesheetService.createTimesheet(
                CreateTimesheetRequest.builder()
                        .projectId(12L)
                        .workDate(LocalDate.of(2026, 8, 19))
                        .hours(new BigDecimal("8.00"))
                        .description("  Worked on customer portal improvements  ")
                        .workLocation(WorkLocation.WORK_FROM_HOME)
                        .saveAsDraft(true)
                        .build(),
                authentication
        );

        assertEquals(new BigDecimal("8"), response.getHours());
        assertEquals("Worked on customer portal improvements", response.getDescription());
        assertEquals(TimesheetStatus.DRAFT, response.getStatus());
        verify(timesheetEntryRepository).save(any(TimesheetEntry.class));
    }

    @Test
    void createSubmitted_setsSubmittedTimestamp() {
        User developer = developer(7L);
        Project project = project(12L, developer);
        when(userRepository.findByEmail("developer@example.com")).thenReturn(Optional.of(developer));
        when(projectRepository.findById(12L)).thenReturn(Optional.of(project));
        when(taskRepository.existsByProject_IdAndAssignedTo_Id(12L, 7L)).thenReturn(true);
        when(timesheetEntryRepository.save(any(TimesheetEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TimesheetResponse response = timesheetService.createTimesheet(
                createRequest(12L, null, false),
                authentication("developer@example.com")
        );

        assertEquals(TimesheetStatus.SUBMITTED, response.getStatus());
        assertNotNull(response.getSubmittedAt());
    }

    @Test
    void createRejectsProjectNotAssignedToDeveloper() {
        User developer = developer(7L);
        when(userRepository.findByEmail("developer@example.com")).thenReturn(Optional.of(developer));
        when(projectRepository.findById(12L)).thenReturn(Optional.of(project(12L, developer)));
        when(taskRepository.existsByProject_IdAndAssignedTo_Id(12L, 7L)).thenReturn(false);

        assertThrows(
                AccessDeniedException.class,
                () -> timesheetService.createTimesheet(
                        createRequest(12L, null, true),
                        authentication("developer@example.com")
                )
        );
    }

    @Test
    void optionsGroupAssignedTasksByProject() {
        User developer = developer(7L);
        Project project = project(12L, developer);
        TaskItem taskOne = task(21L, "First task", developer, project);
        TaskItem taskTwo = task(22L, "Second task", developer, project);
        when(userRepository.findByEmail("developer@example.com")).thenReturn(Optional.of(developer));
        when(taskRepository.findByAssignedToId(7L)).thenReturn(List.of(taskOne, taskTwo));

        TimesheetOptionsResponse response = timesheetService.getMyOptions(authentication("developer@example.com"));

        assertEquals(1, response.getProjects().size());
        assertEquals(12L, response.getProjects().get(0).getId());
        assertEquals(1, response.getTaskGroups().size());
        assertEquals(2, response.getTaskGroups().get(0).getTasks().size());
    }

    @Test
    void summaryCountsStatusesAndHours() {
        User developer = developer(7L);
        when(userRepository.findByEmail("developer@example.com")).thenReturn(Optional.of(developer));
        when(timesheetEntryRepository.findByDeveloperIdOrderByWorkDateDesc(7L)).thenReturn(List.of(
                entry(1L, developer, project(12L, null), TimesheetStatus.DRAFT, "2"),
                entry(2L, developer, project(12L, null), TimesheetStatus.SUBMITTED, "3.5"),
                entry(3L, developer, project(12L, null), TimesheetStatus.APPROVED, "4")
        ));

        TimesheetSummaryResponse summary = timesheetService.getMySummary(authentication("developer@example.com"));

        assertEquals(1, summary.getDraftCount());
        assertEquals(1, summary.getSubmittedCount());
        assertEquals(1, summary.getApprovedCount());
        assertEquals(new BigDecimal("9.5"), summary.getTotalHours());
    }

    @Test
    void managerCanApproveVisibleSubmittedTimesheet() {
        User manager = manager(3L);
        User developer = developer(7L);
        Project project = project(12L, manager);
        TimesheetEntry entry = entry(1L, developer, project, TimesheetStatus.SUBMITTED, "8");
        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(timesheetEntryRepository.findById(1L)).thenReturn(Optional.of(entry));
        when(timesheetEntryRepository.save(any(TimesheetEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TimesheetResponse response = timesheetService.approveTimesheet(1L, authentication("manager@example.com"));

        assertEquals(TimesheetStatus.APPROVED, response.getStatus());
        assertEquals(manager.getName(), response.getReviewedByName());
        assertNotNull(response.getReviewedAt());
    }

    @Test
    void managerRejectsSubmittedTimesheetWithTrimmedReason() {
        User manager = manager(3L);
        User developer = developer(7L);
        TimesheetEntry entry = entry(1L, developer, project(12L, manager), TimesheetStatus.SUBMITTED, "8");
        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(timesheetEntryRepository.findById(1L)).thenReturn(Optional.of(entry));
        when(timesheetEntryRepository.save(any(TimesheetEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TimesheetResponse response = timesheetService.rejectTimesheet(
                1L,
                RejectTimesheetRequest.builder().reason("  Please correct the work description  ").build(),
                authentication("manager@example.com")
        );

        assertEquals(TimesheetStatus.REJECTED, response.getStatus());
        assertEquals("Please correct the work description", response.getRejectionReason());
    }

    @Test
    void managerCannotApproveTimesheetFromAnotherManager() {
        User manager = manager(3L);
        User otherManager = manager(4L);
        TimesheetEntry entry = entry(1L, developer(7L), project(12L, otherManager), TimesheetStatus.SUBMITTED, "8");
        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(timesheetEntryRepository.findById(1L)).thenReturn(Optional.of(entry));

        assertThrows(
                AccessDeniedException.class,
                () -> timesheetService.approveTimesheet(1L, authentication("manager@example.com"))
        );
    }

    @Test
    void unknownStatusFilterIsRejected() {
        User manager = manager(3L);
        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(timesheetEntryRepository.findVisibleForManagerOrderByWorkDateDesc(3L)).thenReturn(List.of());

        assertThrows(
                IllegalArgumentException.class,
                () -> timesheetService.getTeamTimesheets(authentication("manager@example.com"), "NOT_A_STATUS")
        );
    }

    private CreateTimesheetRequest createRequest(Long projectId, Long taskId, boolean draft) {
        return CreateTimesheetRequest.builder()
                .projectId(projectId)
                .taskId(taskId)
                .workDate(LocalDate.of(2026, 8, 19))
                .hours(new BigDecimal("8.00"))
                .description("Completed the assigned implementation and reviewed the resulting changes")
                .workLocation(WorkLocation.WORK_FROM_OFFICE)
                .saveAsDraft(draft)
                .build();
    }

    private TimesheetEntry entry(Long id, User developer, Project project, TimesheetStatus status, String hours) {
        return TimesheetEntry.builder()
                .id(id)
                .developer(developer)
                .project(project)
                .workDate(LocalDate.of(2026, 8, 19))
                .hours(new BigDecimal(hours))
                .description("Completed the assigned implementation and reviewed the resulting changes")
                .workLocation(WorkLocation.WORK_FROM_HOME)
                .status(status)
                .build();
    }

    private User developer(Long id) {
        return User.builder().id(id).name("Developer").email("developer@example.com").role(Role.DEVELOPER).enabled(true).build();
    }

    private User manager(Long id) {
        return User.builder().id(id).name("Manager " + id).email("manager@example.com").role(Role.MANAGER).enabled(true).build();
    }

    private Project project(Long id, User manager) {
        return Project.builder().id(id).name("Customer Portal").manager(manager).build();
    }

    private TaskItem task(Long id, String title, User developer, Project project) {
        return TaskItem.builder().id(id).title(title).assignedTo(developer).project(project).status(TaskStatus.TODO).build();
    }

    private Authentication authentication(String email) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(email);
        return authentication;
    }
}
