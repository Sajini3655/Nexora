package com.admin.service;

import com.admin.dto.CreateClientTicketRequest;
import com.admin.dto.ProjectResponse;
import com.admin.dto.TicketDto;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.Ticket;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ClientPortalService {

    private final ProjectRepository projectRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final LiveUpdatePublisher liveUpdatePublisher;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects(Authentication authentication) {
        User client = getAuthenticatedClient(authentication);
        List<Project> projects = new ArrayList<>(getVisibleProjectsForClient(client));

        return projects.stream()
                .map(this::toProjectResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketDto> getMyTickets(Authentication authentication) {
        User client = getAuthenticatedClient(authentication);
        Set<Long> projectIds = getVisibleProjectIdsForClient(client);

        if (projectIds.isEmpty()) {
            return List.of();
        }

        return ticketRepository.findByProject_IdInOrderByCreatedAtDesc(projectIds)
                .stream()
                .filter(ticket -> ticket.getProject() != null && ticket.getProject().getId() != null)
                .filter(ticket -> projectIds.contains(ticket.getProject().getId()))
                .map(this::toTicketDto)
                .toList();
    }

    @Transactional
    public TicketDto createTicket(Authentication authentication, CreateClientTicketRequest request) {
        User client = getAuthenticatedClient(authentication);

        if (request == null || request.getProjectId() == null) {
            throw new IllegalArgumentException("projectId is required");
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!isProjectVisibleToClient(project, client)) {
            throw new AccessDeniedException("You can only create tickets for your own projects");
        }

        String title = buildTitle(request.getCategory(), request.getTitle());
        String priority = normalizePriority(request.getPriority());

        Ticket ticket = Ticket.builder()
                .title(title)
                .description(request.getDescription().trim())
                .status("OPEN")
                .priority(priority)
                .createdBy(client)
                .client(client)
                .manager(project.getManager())
                .project(project)
                .sourceChannel("CLIENT")
                .build();

        if (project.getClient() == null) {
            project.setClient(client);
            projectRepository.save(project);
        }

        Ticket saved = ticketRepository.save(ticket);
        liveUpdatePublisher.publishTicketsChanged("created");

        return toTicketDto(saved);
    }

    private List<Project> getVisibleProjectsForClient(User client) {
        Map<Long, Project> projects = new LinkedHashMap<>();

        projectRepository.findByClient_IdOrderByCreatedAtDesc(client.getId())
                .forEach(project -> projects.put(project.getId(), project));

        ticketRepository.findByClientId(client.getId())
                .stream()
                .map(Ticket::getProject)
                .filter(Objects::nonNull)
                .filter(project -> project.getId() != null)
                .forEach(project -> projects.putIfAbsent(project.getId(), project));

        return new ArrayList<>(projects.values());
    }

    private Set<Long> getVisibleProjectIdsForClient(User client) {
        Set<Long> projectIds = new LinkedHashSet<>();

        projectRepository.findByClient_IdOrderByCreatedAtDesc(client.getId())
                .forEach(project -> {
                    if (project.getId() != null) {
                        projectIds.add(project.getId());
                    }
                });

        ticketRepository.findByClientId(client.getId())
                .stream()
                .map(Ticket::getProject)
                .filter(Objects::nonNull)
                .map(Project::getId)
                .filter(Objects::nonNull)
                .forEach(projectIds::add);

        return projectIds;
    }

    private boolean isProjectVisibleToClient(Project project, User client) {
        if (project == null || client == null || client.getId() == null) {
            return false;
        }

        if (project.getClient() != null && project.getClient().getId() != null
                && project.getClient().getId().equals(client.getId())) {
            return true;
        }

        return getVisibleProjectIdsForClient(client).contains(project.getId());
    }

    private ProjectResponse toProjectResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .managerId(project.getManager() == null ? null : project.getManager().getId())
                .managerName(project.getManager() == null ? null : project.getManager().getName())
                .clientId(project.getClient() == null ? null : project.getClient().getId())
                .clientName(project.getClient() == null ? null : project.getClient().getName())
                .createdAt(project.getCreatedAt())
                .tasks(List.of())
                .build();
    }

    private TicketDto toTicketDto(Ticket ticket) {
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

    private User getAuthenticatedClient(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }

        User client = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (!client.getAllRoles().contains(Role.CLIENT)) {
            throw new AccessDeniedException("Only clients can access this endpoint");
        }

        return client;
    }

    private String buildTitle(String category, String title) {
        String cleanTitle = title == null ? "" : title.trim();
        String cleanCategory = category == null ? "" : category.trim();

        if (cleanCategory.isBlank()) {
            return cleanTitle;
        }

        if (cleanTitle.startsWith("[")) {
            return cleanTitle;
        }

        return "[" + cleanCategory + "] " + cleanTitle;
    }

    private String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return "MEDIUM";
        }

        String normalized = priority.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "LOW", "MEDIUM", "HIGH" -> normalized;
            default -> "MEDIUM";
        };
    }
}