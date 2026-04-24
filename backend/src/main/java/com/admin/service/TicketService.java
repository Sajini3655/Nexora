package com.admin.service;

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

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {
    
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    
    public List<Ticket> getTicketsForUser(String userEmail) {
        User user = getUserByEmail(userEmail);
        return ticketRepository.findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(user.getId(), user.getId());
    }
    
    public Ticket getTicketById(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(id);

        if (!isTicketVisibleToUser(ticket, user)) {
            throw new ResourceNotFoundException("Ticket not found");
        }

        return ticket;
    }
    
    @Transactional
    public Ticket createTicket(String userEmail, Ticket ticket) {
        User user = getUserByEmail(userEmail);
        ticket.setCreatedBy(user);
        return ticketRepository.save(ticket);
    }
    
    @Transactional
    public Ticket updateTicket(String userEmail, Long id, Ticket ticketDetails) {
        User user = getUserByEmail(userEmail);
        Ticket ticket = getTicketOrThrow(id);

        if (!canModifyTicket(ticket, user)) {
            throw new AccessDeniedException("You are not allowed to modify this ticket");
        }
        
        ticket.setTitle(ticketDetails.getTitle());
        ticket.setDescription(ticketDetails.getDescription());
        ticket.setStatus(ticketDetails.getStatus());
        ticket.setPriority(ticketDetails.getPriority());
        
        return ticketRepository.save(ticket);
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
        return (ticket.getCreatedBy() != null && userId.equals(ticket.getCreatedBy().getId()))
                || (ticket.getAssignedTo() != null && userId.equals(ticket.getAssignedTo().getId()));
    }

    private boolean canModifyTicket(Ticket ticket, User user) {
        if (user.getRole() == Role.ADMIN) {
            return true;
        }

        return ticket.getCreatedBy() != null && user.getId().equals(ticket.getCreatedBy().getId());
    }
}