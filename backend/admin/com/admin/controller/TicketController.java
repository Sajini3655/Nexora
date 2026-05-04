package com.admin.controller;

import com.admin.dto.AssignTicketRequest;
import com.admin.dto.TaskDto;
import com.admin.dto.TicketDto;
import com.admin.entity.Ticket;
import com.admin.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER','CLIENT')")
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<TicketDto>> getAllTickets(Authentication authentication) {
        return ResponseEntity.ok(ticketService.getTicketsForUser(authentication.getName()));
    }

    @GetMapping("/email/recent")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getRecentEmailTickets(Authentication authentication) {
        return ResponseEntity.ok(ticketService.getRecentInboxTicketsForUser(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDto> getTicketById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ticketService.getTicketById(authentication.getName(), id));
    }

    @PostMapping
    public ResponseEntity<TicketDto> createTicket(
            @RequestBody Ticket ticket,
            Authentication authentication
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ticketService.createTicket(authentication.getName(), ticket));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketDto> updateTicket(
            @PathVariable Long id,
            @RequestBody Ticket ticket,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ticketService.updateTicket(authentication.getName(), id, ticket));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<TaskDto> assignTicketPost(
            @PathVariable Long id,
            @Valid @RequestBody AssignTicketRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.convertTicketToTask(authentication.getName(), id, request)
        );
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<TaskDto> assignTicketPatch(
            @PathVariable Long id,
            @Valid @RequestBody AssignTicketRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.convertTicketToTask(authentication.getName(), id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id,
            Authentication authentication
    ) {
        ticketService.deleteTicket(authentication.getName(), id);
        return ResponseEntity.ok().build();
    }
}

