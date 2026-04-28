package com.admin.service;

import com.admin.dto.AssignTicketRequest;
import com.admin.dto.TaskDto;
import com.admin.dto.TicketDto;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.StoryPointStatus;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskPriority;
import com.admin.entity.TaskStatus;
import com.admin.entity.TaskStoryPoint;
import com.admin.entity.Ticket;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskStoryPointRepository taskStoryPointRepository;
    private final TaskStoryPointService taskStoryPointService;
    private final LiveUpdatePublisher liveUpdatePublisher;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<TicketDto> getTicketsForUser(String userEmail) {
        User user = getUserByEmail(userEmail);

        List<Ticket> tickets;

        if (user.getAllRoles().contains(Role.ADMIN)) {
            tickets = ticketRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        } else if (user.getAllRoles().contains(Role.MANAGER)) {
            tickets = ticketRepository.findByProjectManagerIdOrCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(
                    user.getId(),
                    user.getId(),
                    user.getId()
            );
        } else {
            tickets = ticketRepository.findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(user.getId(), user.getId());
        }

        return tickets.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketDto getTicketById(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(id);

        if (user.getAllRoles().contains(Role.ADMIN)) {
            return toDto(ticket);
        }

        if (user.getAllRoles().contains(Role.MANAGER) && canAssignTicket(ticket, user)) {
            return toDto(ticket);
        }

        if (!isTicketVisibleToUser(ticket, user)) {
            throw new ResourceNotFoundException("Ticket not found");
        }

        return toDto(ticket);
    }

    @Transactional
    public TicketDto createTicket(String userEmail, Ticket ticket) {
        User user = getUserByEmail(userEmail);
        ticket.setCreatedBy(user);
        ticket.setAssignedTo(resolveAssignee(ticket));
        ticket.setProject(resolveProject(ticket));

        if (ticket.getStatus() == null || ticket.getStatus().isBlank()) {
            ticket.setStatus("OPEN");
        }

        if (ticket.getPriority() == null || ticket.getPriority().isBlank()) {
            ticket.setPriority("MEDIUM");
        }

        TicketDto dto = toDto(ticketRepository.save(ticket));
        liveUpdatePublisher.publishTicketsChanged("created");
        return dto;
    }

    @Transactional
    public TicketDto updateTicket(String userEmail, Long id, Ticket ticketDetails) {
        User user = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(id);

        if (!canModifyTicket(ticket, user)) {
            throw new AccessDeniedException("You are not allowed to modify this ticket");
        }

        ticket.setTitle(ticketDetails.getTitle());
        ticket.setDescription(ticketDetails.getDescription());
        ticket.setStatus(ticketDetails.getStatus());
        ticket.setPriority(ticketDetails.getPriority());

        if (ticketDetails.getAssignedTo() != null) {
            ticket.setAssignedTo(resolveAssignee(ticketDetails));
        }

        if (ticketDetails.getProject() != null) {
            ticket.setProject(resolveProject(ticketDetails));
        }

        TicketDto dto = toDto(ticketRepository.save(ticket));
        liveUpdatePublisher.publishTicketsChanged("updated");
        return dto;
    }

    @Transactional
    public void deleteTicket(String userEmail, @NonNull Long id) {
        User user = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(id);

        if (!canModifyTicket(ticket, user)) {
            throw new AccessDeniedException("You are not allowed to delete this ticket");
        }

        ticketRepository.delete(Objects.requireNonNull(ticket));
        liveUpdatePublisher.publishTicketsChanged("deleted");
    }

    @Transactional
    public TaskDto convertTicketToTask(String userEmail, Long ticketId, AssignTicketRequest request) {
        User actor = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(ticketId);

        if (!canAssignTicket(ticket, actor)) {
            throw new AccessDeniedException("You are not allowed to assign this ticket");
        }

        if (request == null) {
            throw new IllegalArgumentException("Assignment request is required");
        }

        if (!isOpenTicket(ticket)) {
            throw new IllegalArgumentException("Only OPEN tickets can be converted. Current status: " + ticket.getStatus());
        }

        if (ticket.getAssignedTask() != null) {
            throw new IllegalArgumentException("This ticket is already linked to task " + ticket.getAssignedTask().getId());
        }

        if (request.getProjectId() == null) {
            throw new IllegalArgumentException("Project is required for ticket conversion");
        }

        if (request.getDeveloperId() == null) {
            throw new IllegalArgumentException("Developer is required for ticket conversion");
        }

        if (request.getStoryPoints() == null || request.getStoryPoints().isEmpty()) {
            throw new IllegalArgumentException("At least one story point is required");
        }

        request.getStoryPoints().forEach(point -> {
            if (point.getTitle() == null || point.getTitle().isBlank()) {
                throw new IllegalArgumentException("Each story point must have a title");
            }

            if (point.getPointValue() == null || point.getPointValue() < 1) {
                throw new IllegalArgumentException("Each story point pointValue must be greater than 0");
            }
        });

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        User developer = userRepository.findById(request.getDeveloperId())
                .orElseThrow(() -> new ResourceNotFoundException("Developer not found"));

        if (!developer.getAllRoles().contains(Role.DEVELOPER)) {
            throw new IllegalArgumentException("Selected user must have DEVELOPER role");
        }

        int totalEstimatedPoints = request.getStoryPoints().stream()
                .mapToInt(point -> point.getPointValue() == null ? 0 : point.getPointValue())
                .sum();

        TaskItem task = TaskItem.builder()
                .title(ticket.getTitle() == null || ticket.getTitle().isBlank()
                        ? "Converted ticket"
                        : ticket.getTitle().trim())
                .description(buildTaskDescription(ticket))
                .priority(mapPriority(ticket.getPriority()))
                .status(TaskStatus.TODO)
                .estimatedPoints(totalEstimatedPoints)
                .createdBy(actor)
                .assignedTo(developer)
                .project(project)
                .build();

        TaskItem savedTask = taskRepository.save(task);

        request.getStoryPoints().forEach(point -> {
            TaskStoryPoint storyPoint = TaskStoryPoint.builder()
                    .task(savedTask)
                    .title(point.getTitle().trim())
                    .description(point.getDescription())
                    .pointValue(point.getPointValue())
                    .status(StoryPointStatus.TODO)
                    .completed(Boolean.FALSE)
                    .completedAt(null)
                    .completedBy(null)
                    .build();

            taskStoryPointRepository.save(storyPoint);
        });

        taskStoryPointService.updateTaskStatusBasedOnProgress(savedTask.getId());

        ticket.setProject(project);
        ticket.setAssignedTo(developer);
        ticket.setAssignedTask(savedTask);
        ticket.setStatus("ASSIGNED");
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket savedTicket = ticketRepository.saveAndFlush(ticket);

        // HARD FIX:
        // Make sure converted chat/email tickets are permanently hidden from Manager Dashboard.
        // This directly updates the database row even if the JPA entity state is not flushed as expected.
        jdbcTemplate.update(
                "UPDATE tickets SET status = ?, assigned_to = ?, assigned_task_id = ?, project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                "ASSIGNED",
                developer.getId(),
                savedTask.getId(),
                project.getId(),
                ticket.getId()
        );

        savedTicket = ticketRepository.findById(ticket.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found after assignment"));

        // Ticket conversion complete

        liveUpdatePublisher.publishTicketsChanged("assigned");
        liveUpdatePublisher.publishTasksChanged("created");

        return toTaskDto(savedTask);
    }

    private boolean isOpenTicket(Ticket ticket) {
        return ticket != null && "OPEN".equalsIgnoreCase(String.valueOf(ticket.getStatus()).trim());
    }

    private String buildTaskDescription(Ticket ticket) {
        String description = ticket.getDescription() == null ? "" : ticket.getDescription().trim();
        String sourceChannel = ticket.getSourceChannel() == null ? "" : ticket.getSourceChannel().trim();

        if (description.isBlank() && sourceChannel.isBlank()) {
            return null;
        }

        if (sourceChannel.isBlank()) {
            return description;
        }

        if (description.isBlank()) {
            return "Converted from " + sourceChannel + " ticket";
        }

        return description + "\n\nConverted from " + sourceChannel + " ticket";
    }

    private TaskPriority mapPriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return TaskPriority.MEDIUM;
        }

        try {
            return TaskPriority.valueOf(priority.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return TaskPriority.MEDIUM;
        }
    }

    private TaskDto toTaskDto(TaskItem task) {
        List<TaskStoryPoint> storyPoints = taskStoryPointRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());

        long totalStoryPoints = storyPoints.size();
        long completedStoryPoints = storyPoints.stream()
                .filter(point -> point.getStatus() == StoryPointStatus.DONE)
                .count();

        long totalPointValue = storyPoints.stream()
                .mapToLong(point -> point.getPointValue() == null ? 0 : point.getPointValue())
                .sum();

        long completedPointValue = storyPoints.stream()
                .filter(point -> point.getStatus() == StoryPointStatus.DONE)
                .mapToLong(point -> point.getPointValue() == null ? 0 : point.getPointValue())
                .sum();

        int progressPercentage = totalPointValue > 0
                ? (int) Math.round((completedPointValue * 100.0) / totalPointValue)
                : 0;

        return TaskDto.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .estimatedPoints(task.getEstimatedPoints())
                .createdById(task.getCreatedBy() == null ? null : task.getCreatedBy().getId())
                .assignedToId(task.getAssignedTo() == null ? null : task.getAssignedTo().getId())
                .assignedToName(task.getAssignedTo() == null ? null : task.getAssignedTo().getName())
                .createdAt(task.getCreatedAt())
                .projectId(task.getProject() == null ? null : task.getProject().getId())
                .projectName(task.getProject() == null ? null : task.getProject().getName())
                .totalStoryPoints(totalStoryPoints)
                .completedStoryPoints(completedStoryPoints)
                .totalPointValue(totalPointValue)
                .completedPointValue(completedPointValue)
                .progressPercentage(progressPercentage)
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Ticket getTicketOrThrow(@NonNull Long id) {
        return ticketRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    private boolean isTicketVisibleToUser(Ticket ticket, User user) {
        Long userId = user.getId();
        return (ticket.getCreatedBy() != null && userId.equals(ticket.getCreatedBy().getId()))
                || (ticket.getAssignedTo() != null && userId.equals(ticket.getAssignedTo().getId()));
    }

    private boolean canModifyTicket(Ticket ticket, User user) {
        if (user.getAllRoles().contains(Role.ADMIN)) {
            return true;
        }

        if (user.getAllRoles().contains(Role.MANAGER)) {
            return canAssignTicket(ticket, user);
        }

        return ticket.getCreatedBy() != null && user.getId().equals(ticket.getCreatedBy().getId());
    }

    private boolean canAssignTicket(Ticket ticket, User actor) {
        if (actor.getAllRoles().contains(Role.ADMIN)) {
            return true;
        }

        if (!actor.getAllRoles().contains(Role.MANAGER)) {
            return false;
        }

        if (ticket.getProject() == null || ticket.getProject().getManager() == null) {
            return true;
        }

        return actor.getId().equals(ticket.getProject().getManager().getId());
    }

    private User resolveAssignee(Ticket sourceTicket) {
        if (sourceTicket == null || sourceTicket.getAssignedTo() == null || sourceTicket.getAssignedTo().getId() == null) {
            return null;
        }

        Long assigneeId = sourceTicket.getAssignedTo().getId();
        return userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
    }

    private Project resolveProject(Ticket sourceTicket) {
        if (sourceTicket == null || sourceTicket.getProject() == null || sourceTicket.getProject().getId() == null) {
            return null;
        }

        Long projectId = sourceTicket.getProject().getId();
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private TicketDto toDto(Ticket ticket) {
        return TicketDto.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .projectId(ticket.getProject() == null ? null : ticket.getProject().getId())
                .projectName(ticket.getProject() == null ? null : ticket.getProject().getName())
                .createdById(ticket.getCreatedBy() == null ? null : ticket.getCreatedBy().getId())
                .createdByName(ticket.getCreatedBy() == null ? null : ticket.getCreatedBy().getName())
                .assignedToId(ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getId())
                .assignedToName(ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getName())
                .assignedTaskId(ticket.getAssignedTask() == null ? null : ticket.getAssignedTask().getId())
                .sourceChannel(ticket.getSourceChannel())
                .sourceEmail(ticket.getSourceEmail())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}

