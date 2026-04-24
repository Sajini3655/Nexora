package com.admin.service;

import com.admin.dto.TicketDto;
import com.admin.entity.Role;
import com.admin.entity.Ticket;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.TicketRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {
    
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public List<TicketDto> getTicketsForUser(String userEmail) {
        User user = getUserByEmail(userEmail);

        if (user.getRole() == Role.ADMIN || user.getRole() == Role.MANAGER) {
            return ticketRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                    .stream()
                    .map(this::toDto)
                    .toList();
        }

        return ticketRepository.findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(user.getId(), user.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public TicketDto getTicketById(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(id);

        if (user.getRole() == Role.ADMIN || user.getRole() == Role.MANAGER) {
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
        return toDto(ticketRepository.save(ticket));
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
        
        return toDto(ticketRepository.save(ticket));
    }
    
    @Transactional
    public void deleteTicket(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(id);

        if (!canModifyTicket(ticket, user)) {
            throw new AccessDeniedException("You are not allowed to delete this ticket");
        }

        ticketRepository.delete(ticket);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Ticket getTicketOrThrow(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    private boolean isTicketVisibleToUser(Ticket ticket, User user) {
        Long userId = user.getId();
        return userId.equals(safeUserId(ticket.getCreatedBy()))
                || userId.equals(safeUserId(ticket.getAssignedTo()));
    }

    private boolean canModifyTicket(Ticket ticket, User user) {
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.MANAGER) {
            return true;
        }

        return user.getId().equals(safeUserId(ticket.getCreatedBy()));
    }

    private TicketDto toDto(Ticket ticket) {
        return TicketDto.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .createdById(safeUserId(ticket.getCreatedBy()))
                .createdByName(safeUserName(ticket.getCreatedBy()))
                .assignedToId(safeUserId(ticket.getAssignedTo()))
                .assignedToName(safeUserName(ticket.getAssignedTo()))
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    private Long safeUserId(User user) {
        if (user == null) {
            return null;
        }

        try {
            return user.getId();
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private String safeUserName(User user) {
        if (user == null) {
            return null;
        }

        try {
            return user.getName();
        } catch (RuntimeException ex) {
            return null;
        }
    }
}