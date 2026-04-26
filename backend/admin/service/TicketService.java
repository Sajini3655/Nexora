package com.admin.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {
    
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final LiveUpdatePublisher liveUpdatePublisher;
    
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
    public TicketDto assignTicket(String userEmail, Long ticketId, Long assigneeId) {
        User actor = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(ticketId);

        if (!canAssignTicket(ticket, actor)) {
            throw new AccessDeniedException("You are not allowed to assign this ticket");
        }

        User assignee = null;
        if (assigneeId != null) {
            assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));

            if (!assignee.getAllRoles().contains(Role.DEVELOPER) && !assignee.getAllRoles().contains(Role.MANAGER)) {
                throw new RuntimeException("Assignee must have DEVELOPER or MANAGER role");
            }
        }

        ticket.setAssignedTo(assignee);
        TicketDto dto = toDto(ticketRepository.save(ticket));
        liveUpdatePublisher.publishTicketsChanged("updated");
        return dto;
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
            return ticket.getCreatedBy() != null && actor.getId().equals(ticket.getCreatedBy().getId());
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
                .sourceChannel(ticket.getSourceChannel())
                .sourceEmail(ticket.getSourceEmail())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
