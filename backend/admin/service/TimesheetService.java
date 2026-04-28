package com.admin.service;

import com.admin.dto.TimesheetEntryDto;
import com.admin.dto.TimesheetEntryCreateRequest;
import com.admin.entity.TimesheetEntry;
import com.admin.entity.User;
import com.admin.entity.Project;
import com.admin.entity.TaskItem;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.TimesheetEntryRepository;
import com.admin.repository.UserRepository;
import com.admin.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * TimesheetService - Manages timesheet entries for developers
 * 
 * Handles:
 * - Creating and updating timesheet entries
 * - Submitting timesheets for approval
 * - Approving/rejecting timesheets
 * - Querying timesheets by developer, project, date range, status
 */
@Service
@RequiredArgsConstructor
public class TimesheetService {

    private final TimesheetEntryRepository timesheetRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    /**
     * Developer creates or updates a draft timesheet
     */
    @Transactional
    public TimesheetEntryDto createDraftTimesheet(
            TimesheetEntryCreateRequest request,
            Authentication authentication) {
        User developer = getAuthenticatedUser(authentication);

        // Validate
        if (request.getProjectId() == null || request.getProjectId() <= 0) {
            throw new IllegalArgumentException("Project ID is required");
        }
        if (request.getWorkDate() == null) {
            throw new IllegalArgumentException("Work date is required");
        }
        if (request.getHoursWorked() == null || request.getHoursWorked() <= 0) {
            throw new IllegalArgumentException("Hours worked must be greater than 0");
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        TaskItem task = null;
        if (request.getTaskId() != null && request.getTaskId() > 0) {
            // Verify task belongs to project
            task = project.getTasks().stream()
                    .filter(t -> t.getId().equals(request.getTaskId()))
                    .findFirst()
                    .orElse(null);
        }

        TimesheetEntry entry = TimesheetEntry.builder()
                .developer(developer)
                .project(project)
                .task(task)
                .workDate(request.getWorkDate())
                .hoursWorked(request.getHoursWorked())
                .description(request.getDescription())
                .status(TimesheetEntry.TimesheetStatus.DRAFT)
                .build();

        entry = timesheetRepository.save(entry);
        return mapToDto(entry);
    }

    /**
     * Developer submits a draft timesheet
     */
    @Transactional
    public TimesheetEntryDto submitTimesheet(
            Long timesheetId,
            Authentication authentication) {
        User developer = getAuthenticatedUser(authentication);

        TimesheetEntry entry = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet not found"));

        // Only developer can submit their own timesheet
        if (!entry.getDeveloper().getId().equals(developer.getId())) {
            throw new AccessDeniedException("Cannot submit another developer's timesheet");
        }

        // Can only submit from DRAFT status
        if (!entry.getStatus().equals(TimesheetEntry.TimesheetStatus.DRAFT)) {
            throw new IllegalArgumentException("Can only submit draft timesheets");
        }

        entry.setStatus(TimesheetEntry.TimesheetStatus.SUBMITTED);
        entry = timesheetRepository.save(entry);
        return mapToDto(entry);
    }

    /**
     * Manager approves a submitted timesheet
     */
    @Transactional
    public TimesheetEntryDto approveTimesheet(
            Long timesheetId,
            Authentication authentication) {
        User manager = getAuthenticatedUser(authentication);

        TimesheetEntry entry = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet not found"));

        // Verify manager has access to the project
        if (!canManagerApproveTimesheet(manager, entry.getProject())) {
            throw new AccessDeniedException("Cannot approve timesheet for this project");
        }

        if (!entry.getStatus().equals(TimesheetEntry.TimesheetStatus.SUBMITTED)) {
            throw new IllegalArgumentException("Can only approve submitted timesheets");
        }

        entry.setStatus(TimesheetEntry.TimesheetStatus.APPROVED);
        entry.setApprovedBy(manager);
        entry.setApprovedAt(LocalDateTime.now());
        entry = timesheetRepository.save(entry);
        return mapToDto(entry);
    }

    /**
     * Manager rejects a submitted timesheet
     */
    @Transactional
    public TimesheetEntryDto rejectTimesheet(
            Long timesheetId,
            String rejectionReason,
            Authentication authentication) {
        User manager = getAuthenticatedUser(authentication);

        TimesheetEntry entry = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet not found"));

        // Verify manager has access to the project
        if (!canManagerApproveTimesheet(manager, entry.getProject())) {
            throw new AccessDeniedException("Cannot reject timesheet for this project");
        }

        if (!entry.getStatus().equals(TimesheetEntry.TimesheetStatus.SUBMITTED)) {
            throw new IllegalArgumentException("Can only reject submitted timesheets");
        }

        entry.setStatus(TimesheetEntry.TimesheetStatus.REJECTED);
        entry.setRejectionReason(rejectionReason);
        entry = timesheetRepository.save(entry);
        return mapToDto(entry);
    }

    /**
     * Get timesheets for a developer
     */
    public List<TimesheetEntryDto> getDeveloperTimesheets(
            Long developerId,
            Authentication authentication) {
        User developer = userRepository.findById(developerId)
                .orElseThrow(() -> new ResourceNotFoundException("Developer not found"));

        List<TimesheetEntry> entries = timesheetRepository.findByDeveloperOrderByWorkDateDesc(developer);
        return entries.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Get timesheets for current developer
     */
    public List<TimesheetEntryDto> getMyTimesheets(Authentication authentication) {
        User developer = getAuthenticatedUser(authentication);
        return getDeveloperTimesheets(developer.getId(), authentication);
    }

    /**
     * Get submitted timesheets for manager approval
     */
    public List<TimesheetEntryDto> getSubmittedTimesheets(
            Authentication authentication,
            Long projectId) {
        User manager = getAuthenticatedUser(authentication);

        List<TimesheetEntry> entries = timesheetRepository.findSubmittedTimesheets();

        // Filter by project if manager manages it
        if (projectId != null && projectId > 0) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

            if (!project.getManager().getId().equals(manager.getId())) {
                throw new AccessDeniedException("Cannot view timesheets for this project");
            }

            entries = entries.stream()
                    .filter(e -> e.getProject().getId().equals(projectId))
                    .collect(Collectors.toList());
        } else {
            // Filter to only projects this manager manages
            entries = entries.stream()
                    .filter(e -> e.getProject().getManager().getId().equals(manager.getId()))
                    .collect(Collectors.toList());
        }

        return entries.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Get all timesheets (admin only)
     */
    public Page<TimesheetEntryDto> getAllTimesheets(
            Long developerId,
            Long projectId,
            TimesheetEntry.TimesheetStatus status,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable) {
        return timesheetRepository.findByFilters(
                developerId,
                projectId,
                status,
                dateFrom,
                dateTo,
                pageable
        ).map(this::mapToDto);
    }

    /**
     * Get total approved hours for developer
     */
    public Double getDeveloperTotalApprovedHours(Long developerId) {
        User developer = userRepository.findById(developerId)
                .orElseThrow(() -> new ResourceNotFoundException("Developer not found"));
        return timesheetRepository.getTotalApprovedHoursByDeveloper(developer);
    }

    /**
     * Get total approved hours for project
     */
    public Double getProjectTotalApprovedHours(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        return timesheetRepository.getTotalApprovedHoursByProject(project);
    }

    // ============ HELPER METHODS ============

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean canManagerApproveTimesheet(User manager, Project project) {
        return project.getManager().getId().equals(manager.getId());
    }

    private TimesheetEntryDto mapToDto(TimesheetEntry entry) {
        return TimesheetEntryDto.builder()
                .id(entry.getId())
                .developerId(entry.getDeveloper().getId())
                .developerName(entry.getDeveloper().getName())
                .projectId(entry.getProject().getId())
                .projectName(entry.getProject().getName())
                .taskId(entry.getTask() != null ? entry.getTask().getId() : null)
                .taskName(entry.getTask() != null ? entry.getTask().getTitle() : null)
                .workDate(entry.getWorkDate())
                .hoursWorked(entry.getHoursWorked())
                .description(entry.getDescription())
                .status(entry.getStatus().toString())
                .approvedBy(entry.getApprovedBy() != null ? entry.getApprovedBy().getName() : null)
                .approvedAt(entry.getApprovedAt())
                .rejectionReason(entry.getRejectionReason())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}
