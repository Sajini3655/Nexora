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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);
    private static final Set<String> INBOX_SOURCES = Set.of("EMAIL", "CHAT", "CHAT_SUMMARY", "CLIENT", "MANAGER");

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
            tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
        } else if (user.getAllRoles().contains(Role.MANAGER)) {
            tickets = ticketRepository.findManagerVisibleTickets(user.getId());
        } else if (user.getAllRoles().contains(Role.DEVELOPER)) {
            tickets = ticketRepository.findByAssignedDeveloperId(user.getId());
        } else if (user.getAllRoles().contains(Role.CLIENT)) {
            tickets = ticketRepository.findClientVisibleTickets(user.getId());
        } else {
            tickets = List.of();
        }

        return tickets.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecentInboxTicketsForUser(String userEmail) {
        User user = getUserByEmail(userEmail);

        List<Ticket> base;
        if (user.getAllRoles().contains(Role.ADMIN)) {
            base = ticketRepository.findAllByOrderByCreatedAtDesc();
        } else if (user.getAllRoles().contains(Role.MANAGER)) {
            base = ticketRepository.findManagerVisibleTickets(user.getId());
        } else {
            return List.of();
        }

        return base.stream()
                .filter(this::isInInboxQueue)
                .limit(5)
                .map(this::toInboxMap)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketDto getTicketById(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(id);

        if (!isTicketVisibleToUser(ticket, user)) {
            throw new ResourceNotFoundException("Ticket not found");
        }

        return toDto(ticket);
    }

    @Transactional
    public TicketDto createTicket(String userEmail, Ticket request) {
        User actor = getUserByEmail(userEmail);
        Project project = resolveProject(request);
        User assignee = resolveAssignee(request);

        if (actor.getAllRoles().contains(Role.CLIENT) && project == null) {
            throw new IllegalArgumentException("projectId is required when a client creates a ticket");
        }

        if (actor.getAllRoles().contains(Role.MANAGER) && project != null && !isSameUser(project.getManager(), actor)) {
            throw new AccessDeniedException("Managers can only create tickets for their own projects");
        }

        Ticket ticket = request == null ? new Ticket() : request;
        ticket.setCreatedBy(actor);
        ticket.setAssignedTo(assignee);
        ticket.setProject(project);

        if (ticket.getStatus() == null || ticket.getStatus().isBlank()) {
            ticket.setStatus("OPEN");
        }

        if (ticket.getPriority() == null || ticket.getPriority().isBlank()) {
            ticket.setPriority("MEDIUM");
        }

        String normalizedSource = normalizeSource(ticket.getSourceChannel());
        if (normalizedSource == null) {
            if (actor.getAllRoles().contains(Role.CLIENT)) {
                normalizedSource = "CLIENT";
            } else if (actor.getAllRoles().contains(Role.MANAGER)) {
                normalizedSource = "MANAGER";
            } else if (actor.getAllRoles().contains(Role.ADMIN)) {
                normalizedSource = "ADMIN";
            } else {
                normalizedSource = "MANAGER";
            }
        }
        ticket.setSourceChannel(normalizedSource);

        if (actor.getAllRoles().contains(Role.CLIENT)) {
            ticket.setClient(actor);
            ticket.setManager(project == null ? null : project.getManager());
            ticket.setAssignedTo(null);
            log.info("ticket_routing source=CLIENT projectId={} managerId={} clientId={}",
                    project == null ? null : project.getId(),
                    ticket.getManager() == null ? null : ticket.getManager().getId(),
                    actor.getId());
        } else if (actor.getAllRoles().contains(Role.MANAGER)) {
            ticket.setManager(actor);
            if (project != null) {
                ticket.setManager(project.getManager());
            }
            log.info("ticket_routing source=MANAGER projectId={} managerId={}",
                    project == null ? null : project.getId(),
                    ticket.getManager() == null ? null : ticket.getManager().getId());
        } else {
            if (project != null && project.getManager() != null) {
                ticket.setManager(project.getManager());
            }
        }

        Ticket saved = ticketRepository.save(ticket);
        liveUpdatePublisher.publishTicketsChanged("created");
        return toDto(saved);
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
            Project project = resolveProject(ticketDetails);
            ticket.setProject(project);
            ticket.setManager(project == null ? ticket.getManager() : project.getManager());
        }

        if (user.getAllRoles().contains(Role.ADMIN)) {
            if (ticketDetails.getManager() != null && ticketDetails.getManager().getId() != null) {
                ticket.setManager(resolveUser(ticketDetails.getManager().getId(), "Manager not found"));
            }
            if (ticketDetails.getClient() != null && ticketDetails.getClient().getId() != null) {
                ticket.setClient(resolveUser(ticketDetails.getClient().getId(), "Client not found"));
            }
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
        ticket.setManager(project.getManager());
        ticket.setAssignedTo(developer);
        ticket.setAssignedTask(savedTask);
        ticket.setStatus("ASSIGNED");
        ticket.setUpdatedAt(LocalDateTime.now());

        ticketRepository.saveAndFlush(ticket);

        jdbcTemplate.update(
                "UPDATE tickets SET status = ?, manager_id = ?, assigned_to = ?, assigned_task_id = ?, project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                "ASSIGNED",
                project.getManager() == null ? null : project.getManager().getId(),
                developer.getId(),
                savedTask.getId(),
                project.getId(),
                ticket.getId()
        );

        liveUpdatePublisher.publishTicketsChanged("assigned");
        liveUpdatePublisher.publishTasksChanged("created");

        return toTaskDto(savedTask);
    }

    private boolean isOpenTicket(Ticket ticket) {
        return ticket != null && "OPEN".equalsIgnoreCase(String.valueOf(ticket.getStatus()).trim());
    }

    private boolean isInInboxQueue(Ticket ticket) {
        if (ticket == null) return false;
        if (!"OPEN".equalsIgnoreCase(String.valueOf(ticket.getStatus()).trim())) return false;
        if (ticket.getAssignedTask() != null) return false;
        String source = normalizeSource(ticket.getSourceChannel());
        return source != null && INBOX_SOURCES.contains(source);
    }

    private Map<String, Object> toInboxMap(Ticket ticket) {
        Map<String, Object> row = new LinkedHashMap<>();
        String description = ticket.getDescription();

        row.put("id", ticket.getId());
        row.put("title", ticket.getTitle() == null || ticket.getTitle().isBlank() ? "Untitled ticket" : ticket.getTitle());
        row.put("priority", ticket.getPriority() == null || ticket.getPriority().isBlank() ? "MEDIUM" : ticket.getPriority());
        row.put("status", ticket.getStatus() == null || ticket.getStatus().isBlank() ? "OPEN" : ticket.getStatus());
        row.put("projectId", ticket.getProject() == null ? null : ticket.getProject().getId());
        row.put("sourceEmail", fallbackSourceEmail(ticket.getSourceEmail(), description));
        row.put("sourceChannel", fallbackSourceChannel(ticket.getSourceChannel(), description));
        row.put("assignedToId", ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getId());
        row.put("assignedTaskId", ticket.getAssignedTask() == null ? null : ticket.getAssignedTask().getId());
        row.put("createdAt", ticket.getCreatedAt());
        row.put("projectName", ticket.getProject() == null ? null : ticket.getProject().getName());
        row.put("description", description);
        return row;
    }

    private String fallbackSourceEmail(String sourceEmail, String description) {
        if (sourceEmail != null && !sourceEmail.isBlank()) {
            return sourceEmail;
        }

        if (description == null || description.isBlank()) {
            return "project-chat@nexora.local";
        }

        for (String line : description.split("\\R")) {
            if (line != null && line.startsWith("From:")) {
                String email = line.substring(5).trim();
                if (!email.isBlank()) {
                    return email;
                }
            }
        }

        return "project-chat@nexora.local";
    }

    private String fallbackSourceChannel(String sourceChannel, String description) {
        String normalized = normalizeSource(sourceChannel);
        if (normalized != null) {
            return normalized;
        }

        if (description != null && description.contains("Source: EMAIL")) {
            return "EMAIL";
        }

        return "CHAT_SUMMARY";
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
            return TaskPriority.valueOf(priority.trim().toUpperCase(Locale.ROOT));
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

    private User resolveUser(Long userId, String errorMessage) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(errorMessage));
    }

    private Ticket getTicketOrThrow(@NonNull Long id) {
        return ticketRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    private boolean isTicketVisibleToUser(Ticket ticket, User user) {
        if (user.getAllRoles().contains(Role.ADMIN)) {
            return true;
        }

        if (user.getAllRoles().contains(Role.MANAGER)) {
            return isVisibleToManager(ticket, user.getId());
        }

        if (user.getAllRoles().contains(Role.DEVELOPER)) {
            return isSameUser(ticket.getAssignedTo(), user);
        }

        if (user.getAllRoles().contains(Role.CLIENT)) {
            return isSameUser(ticket.getClient(), user)
                    || (ticket.getClient() == null && isSameUser(ticket.getCreatedBy(), user));
        }

        return false;
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

        return isVisibleToManager(ticket, actor.getId());
    }

    private boolean isVisibleToManager(Ticket ticket, Long managerId) {
        if (ticket == null || managerId == null) {
            return false;
        }

        if (ticket.getManager() != null && managerId.equals(ticket.getManager().getId())) {
            return true;
        }

        return ticket.getProject() != null
                && ticket.getProject().getManager() != null
                && managerId.equals(ticket.getProject().getManager().getId());
    }

    private boolean isSameUser(User left, User right) {
        return left != null && right != null && left.getId() != null && left.getId().equals(right.getId());
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

    private String normalizeSource(String sourceChannel) {
        if (sourceChannel == null) {
            return null;
        }
        String normalized = sourceChannel.trim().toUpperCase(Locale.ROOT);
        return normalized.isBlank() ? null : normalized;
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
                .assignedTaskId(ticket.getAssignedTask() == null ? null : ticket.getAssignedTask().getId())
                .managerId(ticket.getManager() == null ? null : ticket.getManager().getId())
                .clientId(ticket.getClient() == null ? null : ticket.getClient().getId())
                .createdById(ticket.getCreatedBy() == null ? null : ticket.getCreatedBy().getId())
                .createdByName(ticket.getCreatedBy() == null ? null : ticket.getCreatedBy().getName())
                .assignedToId(ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getId())
                .assignedToName(ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getName())
                .sourceChannel(ticket.getSourceChannel())
                .sourceEmail(ticket.getSourceEmail())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
