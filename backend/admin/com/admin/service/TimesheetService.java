package com.admin.service;

import com.admin.dto.CreateTimesheetRequest;
import com.admin.dto.RejectTimesheetRequest;
import com.admin.dto.TimesheetOptionsResponse;
import com.admin.dto.TimesheetResponse;
import com.admin.dto.TimesheetSummaryResponse;
import com.admin.dto.UpdateTimesheetRequest;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.TaskItem;
import com.admin.entity.TimesheetEntry;
import com.admin.entity.TimesheetStatus;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TimesheetEntryRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TimesheetService {

    private final TimesheetEntryRepository timesheetEntryRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<TimesheetResponse> getMyTimesheets(Authentication authentication) {
        User developer = requireUser(authentication);
        requireRole(developer, Role.DEVELOPER);

        return timesheetEntryRepository.findByDeveloperIdOrderByWorkDateDesc(developer.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TimesheetSummaryResponse getMySummary(Authentication authentication) {
        User developer = requireUser(authentication);
        requireRole(developer, Role.DEVELOPER);

        return summarize(timesheetEntryRepository.findByDeveloperIdOrderByWorkDateDesc(developer.getId()));
    }

    @Transactional(readOnly = true)
    public TimesheetOptionsResponse getMyOptions(Authentication authentication) {
        User developer = requireUser(authentication);
        requireRole(developer, Role.DEVELOPER);

        List<TaskItem> assignedTasks = taskRepository.findByAssignedToId(developer.getId());
        Map<Long, TimesheetOptionsResponse.ProjectOption> projectsById = new LinkedHashMap<>();
        Map<Long, List<TimesheetOptionsResponse.TaskOption>> tasksByProject = new LinkedHashMap<>();

        for (TaskItem task : assignedTasks) {
            if (task.getProject() == null || task.getProject().getId() == null) {
                continue;
            }

            Long projectId = task.getProject().getId();
            projectsById.putIfAbsent(projectId, TimesheetOptionsResponse.ProjectOption.builder()
                    .id(projectId)
                    .name(task.getProject().getName())
                    .build());

            tasksByProject.computeIfAbsent(projectId, key -> new ArrayList<>())
                    .add(TimesheetOptionsResponse.TaskOption.builder()
                            .id(task.getId())
                            .title(task.getTitle())
                            .build());
        }

        List<TimesheetOptionsResponse.ProjectTaskGroupOption> taskGroups = projectsById.values().stream()
                .map(project -> TimesheetOptionsResponse.ProjectTaskGroupOption.builder()
                        .projectId(project.getId())
                        .projectName(project.getName())
                        .tasks(tasksByProject.getOrDefault(project.getId(), List.of()))
                        .build())
                .toList();

        return TimesheetOptionsResponse.builder()
                .projects(new ArrayList<>(projectsById.values()))
                .taskGroups(taskGroups)
                .build();
    }

    @Transactional
    public TimesheetResponse createTimesheet(CreateTimesheetRequest request, Authentication authentication) {
        User developer = requireUser(authentication);
        requireRole(developer, Role.DEVELOPER);

        Project project = resolveDeveloperProject(developer.getId(), request.getProjectId());
        TaskItem task = resolveDeveloperTask(developer.getId(), request.getTaskId(), project.getId());

        TimesheetEntry entry = TimesheetEntry.builder()
                .developer(developer)
                .project(project)
                .task(task)
                .workDate(request.getWorkDate())
                .hours(normalizeHours(request.getHours()))
                .description(request.getDescription().trim())
                .workLocation(request.getWorkLocation())
                .status(Boolean.FALSE.equals(request.getSaveAsDraft())
                        ? TimesheetStatus.SUBMITTED
                        : TimesheetStatus.DRAFT)
                .build();

        if (entry.getStatus() == TimesheetStatus.SUBMITTED) {
            entry.setSubmittedAt(LocalDateTime.now());
        }

        return toResponse(timesheetEntryRepository.save(entry));
    }

    @Transactional
    public TimesheetResponse updateTimesheet(Long id, UpdateTimesheetRequest request, Authentication authentication) {
        User developer = requireUser(authentication);
        requireRole(developer, Role.DEVELOPER);

        TimesheetEntry entry = requireEntry(id);
        ensureOwnedDraft(entry, developer);

        Project project = resolveDeveloperProject(developer.getId(), request.getProjectId());
        TaskItem task = resolveDeveloperTask(developer.getId(), request.getTaskId(), project.getId());

        entry.setProject(project);
        entry.setTask(task);
        entry.setWorkDate(request.getWorkDate());
        entry.setHours(normalizeHours(request.getHours()));
        entry.setDescription(request.getDescription().trim());
        entry.setWorkLocation(request.getWorkLocation());

        return toResponse(timesheetEntryRepository.save(entry));
    }

    @Transactional
    public void deleteTimesheet(Long id, Authentication authentication) {
        User developer = requireUser(authentication);
        requireRole(developer, Role.DEVELOPER);

        TimesheetEntry entry = requireEntry(id);
        ensureOwnedDraft(entry, developer);

        timesheetEntryRepository.delete(entry);
    }

    @Transactional
    public TimesheetResponse submitTimesheet(Long id, Authentication authentication) {
        User developer = requireUser(authentication);
        requireRole(developer, Role.DEVELOPER);

        TimesheetEntry entry = requireEntry(id);
        ensureOwnedDraft(entry, developer);

        entry.setStatus(TimesheetStatus.SUBMITTED);
        entry.setSubmittedAt(LocalDateTime.now());
        entry.setReviewedAt(null);
        entry.setReviewedBy(null);
        entry.setRejectionReason(null);

        return toResponse(timesheetEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public List<TimesheetResponse> getTeamTimesheets(Authentication authentication, String status) {
        User manager = requireUser(authentication);
        requireRole(manager, Role.MANAGER);

        List<TimesheetEntry> entries = timesheetEntryRepository.findVisibleForManagerOrderByWorkDateDesc(manager.getId());
        TimesheetStatus filterStatus = parseStatusFilter(status);

        return entries.stream()
                .filter(entry -> filterStatus == null || entry.getStatus() == filterStatus)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TimesheetSummaryResponse getTeamSummary(Authentication authentication) {
        User manager = requireUser(authentication);
        requireRole(manager, Role.MANAGER);

        return summarize(timesheetEntryRepository.findVisibleForManagerOrderByWorkDateDesc(manager.getId()));
    }

    @Transactional
    public TimesheetResponse approveTimesheet(Long id, Authentication authentication) {
        User manager = requireUser(authentication);
        requireRole(manager, Role.MANAGER);

        TimesheetEntry entry = requireEntry(id);
        ensureManagerVisibility(entry, manager);
        ensureSubmitted(entry);

        entry.setStatus(TimesheetStatus.APPROVED);
        entry.setReviewedAt(LocalDateTime.now());
        entry.setReviewedBy(manager);
        entry.setRejectionReason(null);

        return toResponse(timesheetEntryRepository.save(entry));
    }

    @Transactional
    public TimesheetResponse rejectTimesheet(Long id, RejectTimesheetRequest request, Authentication authentication) {
        User manager = requireUser(authentication);
        requireRole(manager, Role.MANAGER);

        TimesheetEntry entry = requireEntry(id);
        ensureManagerVisibility(entry, manager);
        ensureSubmitted(entry);

        entry.setStatus(TimesheetStatus.REJECTED);
        entry.setReviewedAt(LocalDateTime.now());
        entry.setReviewedBy(manager);
        entry.setRejectionReason(request.getReason().trim());

        return toResponse(timesheetEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public List<TimesheetResponse> getAdminTimesheets(Authentication authentication,
                                                      String status,
                                                      Long developerId,
                                                      Long projectId,
                                                      LocalDate fromDate,
                                                      LocalDate toDate) {
        User admin = requireUser(authentication);
        requireRole(admin, Role.ADMIN);
        TimesheetStatus filterStatus = parseStatusFilter(status);

        return timesheetEntryRepository.findAllByOrderByWorkDateDesc().stream()
                .filter(entry -> filterStatus == null || entry.getStatus() == filterStatus)
                .filter(entry -> developerId == null || Objects.equals(getId(entry.getDeveloper()), developerId))
                .filter(entry -> projectId == null || Objects.equals(getId(entry.getProject()), projectId))
                .filter(entry -> fromDate == null || !entry.getWorkDate().isBefore(fromDate))
                .filter(entry -> toDate == null || !entry.getWorkDate().isAfter(toDate))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TimesheetSummaryResponse getAdminSummary(Authentication authentication,
                                                    String status,
                                                    Long developerId,
                                                    Long projectId,
                                                    LocalDate fromDate,
                                                    LocalDate toDate) {
        User admin = requireUser(authentication);
        requireRole(admin, Role.ADMIN);
        TimesheetStatus filterStatus = parseStatusFilter(status);

        List<TimesheetEntry> entries = timesheetEntryRepository.findAllByOrderByWorkDateDesc().stream()
                .filter(entry -> filterStatus == null || entry.getStatus() == filterStatus)
                .filter(entry -> developerId == null || Objects.equals(getId(entry.getDeveloper()), developerId))
                .filter(entry -> projectId == null || Objects.equals(getId(entry.getProject()), projectId))
                .filter(entry -> fromDate == null || !entry.getWorkDate().isBefore(fromDate))
                .filter(entry -> toDate == null || !entry.getWorkDate().isAfter(toDate))
                .toList();

        return summarize(entries);
    }

    private TimesheetSummaryResponse summarize(List<TimesheetEntry> entries) {
        long draftCount = 0;
        long submittedCount = 0;
        long approvedCount = 0;
        long rejectedCount = 0;
        BigDecimal totalHours = BigDecimal.ZERO;

        for (TimesheetEntry entry : entries) {
            if (entry.getStatus() == TimesheetStatus.DRAFT) {
                draftCount++;
            } else if (entry.getStatus() == TimesheetStatus.SUBMITTED) {
                submittedCount++;
            } else if (entry.getStatus() == TimesheetStatus.APPROVED) {
                approvedCount++;
            } else if (entry.getStatus() == TimesheetStatus.REJECTED) {
                rejectedCount++;
            }

            if (entry.getHours() != null) {
                totalHours = totalHours.add(entry.getHours());
            }
        }

        return TimesheetSummaryResponse.builder()
                .draftCount(draftCount)
                .submittedCount(submittedCount)
                .approvedCount(approvedCount)
                .rejectedCount(rejectedCount)
                .totalHours(totalHours)
                .totalEntries(entries.size())
                .build();
    }

    private TimesheetStatus parseStatusFilter(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status.trim())) {
            return null;
        }

        String normalized = status.trim().toUpperCase();
        if ("PENDING".equals(normalized)) {
            return TimesheetStatus.SUBMITTED;
        }

        try {
            return TimesheetStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid timesheet status: " + status);
        }
    }

    private void ensureOwnedDraft(TimesheetEntry entry, User developer) {
        if (entry.getDeveloper() == null || !Objects.equals(getId(entry.getDeveloper()), developer.getId())) {
            throw new AccessDeniedException("You can only modify your own timesheets");
        }

        if (entry.getStatus() != TimesheetStatus.DRAFT) {
            throw new AccessDeniedException("Only draft timesheets can be modified");
        }
    }

    private void ensureSubmitted(TimesheetEntry entry) {
        if (entry.getStatus() != TimesheetStatus.SUBMITTED) {
            throw new IllegalArgumentException("Only submitted timesheets can be reviewed");
        }
    }

    private void ensureManagerVisibility(TimesheetEntry entry, User manager) {
        if (!isVisibleToManager(entry, manager)) {
            throw new AccessDeniedException("You cannot review this timesheet");
        }
    }

    private boolean isVisibleToManager(TimesheetEntry entry, User manager) {
        if (entry == null || manager == null) {
            return false;
        }

        Long managerId = manager.getId();
        return (entry.getProject() != null && entry.getProject().getManager() != null && Objects.equals(entry.getProject().getManager().getId(), managerId))
                || (entry.getTask() != null
                && entry.getTask().getProject() != null
                && entry.getTask().getProject().getManager() != null
                && Objects.equals(entry.getTask().getProject().getManager().getId(), managerId));
    }

    private Project resolveDeveloperProject(Long developerId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!taskRepository.existsByProject_IdAndAssignedTo_Id(projectId, developerId)) {
            throw new AccessDeniedException("Project is not assigned to this developer");
        }

        return project;
    }

    private TaskItem resolveDeveloperTask(Long developerId, Long taskId, Long projectId) {
        if (taskId == null) {
            return null;
        }

        TaskItem task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (task.getAssignedTo() == null || task.getAssignedTo().getId() == null || !Objects.equals(task.getAssignedTo().getId(), developerId)) {
            throw new AccessDeniedException("Task is not assigned to this developer");
        }

        if (task.getProject() == null || task.getProject().getId() == null || !Objects.equals(task.getProject().getId(), projectId)) {
            throw new AccessDeniedException("Task must belong to the selected project");
        }

        return task;
    }

    private TimesheetEntry requireEntry(Long id) {
        return timesheetEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet not found"));
    }

    private User requireUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private void requireRole(User user, Role role) {
        if (user == null || !user.getAllRoles().contains(role)) {
            throw new AccessDeniedException("You are not allowed to access timesheets");
        }
    }

    private TimesheetResponse toResponse(TimesheetEntry entry) {
        return TimesheetResponse.builder()
                .id(entry.getId())
                .developerId(getId(entry.getDeveloper()))
                .developerName(entry.getDeveloper() == null ? null : entry.getDeveloper().getName())
                .projectId(getId(entry.getProject()))
                .projectName(entry.getProject() == null ? null : entry.getProject().getName())
                .taskId(getId(entry.getTask()))
                .taskTitle(entry.getTask() == null ? null : entry.getTask().getTitle())
                .workDate(entry.getWorkDate())
                .hours(entry.getHours())
                .description(entry.getDescription())
                .workLocation(entry.getWorkLocation())
                .status(entry.getStatus())
                .submittedAt(entry.getSubmittedAt())
                .reviewedAt(entry.getReviewedAt())
                .reviewedByName(entry.getReviewedBy() == null ? null : entry.getReviewedBy().getName())
                .rejectionReason(entry.getRejectionReason())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    private Long getId(User user) {
        return user == null ? null : user.getId();
    }

    private Long getId(Project project) {
        return project == null ? null : project.getId();
    }

    private Long getId(TaskItem task) {
        return task == null ? null : task.getId();
    }

    private BigDecimal normalizeHours(BigDecimal hours) {
        if (hours == null) {
            return BigDecimal.ZERO;
        }

        return hours.stripTrailingZeros();
    }
}
