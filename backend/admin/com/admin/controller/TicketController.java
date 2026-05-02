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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER','CLIENT')")
public class TicketController {

    private final TicketService ticketService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<TicketDto>> getAllTickets(Authentication authentication) {
        return ResponseEntity.ok(ticketService.getTicketsForUser(authentication.getName()));
    }

    @GetMapping("/email/recent")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getRecentEmailTickets() {
        String sql = """
                SELECT
                    t.id,
                    COALESCE(t.title, 'Untitled ticket') AS title,
                    COALESCE(t.priority, 'MEDIUM') AS priority,
                    COALESCE(t.status, 'OPEN') AS status,
                    t.project_id AS project_id,
                    t.assigned_to AS assigned_to_id,
                    t.assigned_task_id AS assigned_task_id,
                    t.created_at,
                    t.description,
                    t.source_channel,
                    t.source_email,
                    p.name AS project_name
                FROM tickets t
                LEFT JOIN projects p ON p.id = t.project_id
                WHERE (
                        t.description ILIKE '%Source: EMAIL%'
                        OR UPPER(TRIM(COALESCE(t.source_channel, ''))) = 'EMAIL'
                        OR UPPER(TRIM(COALESCE(t.source_channel, ''))) = 'CHAT_SUMMARY'
                        OR UPPER(TRIM(COALESCE(t.source_channel, ''))) = 'CLIENT'
                    )
                    AND UPPER(TRIM(COALESCE(t.status, 'OPEN'))) = 'OPEN'
                    AND t.assigned_task_id IS NULL
                    AND NOT EXISTS (
                        SELECT 1
                        FROM tasks task_check
                        WHERE task_check.title = t.title
                          AND task_check.project_id = t.project_id
                          AND task_check.assigned_to_id IS NOT NULL
                    )
                ORDER BY t.created_at DESC NULLS LAST
                LIMIT 5
                """;

        List<Map<String, Object>> result = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> ticket = new LinkedHashMap<>();
            String description = rs.getString("description");

            ticket.put("id", rs.getLong("id"));
            ticket.put("title", rs.getString("title"));
            ticket.put("priority", rs.getString("priority"));
            ticket.put("status", rs.getString("status"));
            ticket.put("projectId", rs.getObject("project_id", Long.class));
            ticket.put("sourceEmail", fallbackSourceEmail(rs.getString("source_email"), description));
            ticket.put("sourceChannel", fallbackSourceChannel(rs.getString("source_channel"), description));
            ticket.put("assignedToId", rs.getObject("assigned_to_id", Long.class));
            ticket.put("assignedTaskId", rs.getObject("assigned_task_id", Long.class));
            ticket.put("createdAt", rs.getObject("created_at"));
            ticket.put("projectName", rs.getString("project_name"));
            ticket.put("description", description);

            return ticket;
        });

        return ResponseEntity.ok(result);
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
        if (sourceChannel != null && !sourceChannel.isBlank()) {
            return sourceChannel;
        }

        if (description != null && description.contains("Source: EMAIL")) {
            return "EMAIL";
        }

        return "CHAT_SUMMARY";
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

