package com.admin.controller;

import com.admin.dto.CreateClientTicketRequest;
import com.admin.dto.ProjectResponse;
import com.admin.dto.ProjectActivityResponseDto;
import com.admin.dto.TicketDto;
import com.admin.service.ClientPortalService;
import com.admin.service.ProjectActivityService;
import com.admin.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
public class ClientController {

    private final ClientPortalService clientPortalService;
    private final ProjectActivityService projectActivityService;

    @GetMapping("/projects")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(Authentication authentication) {
        return ResponseEntity.ok(clientPortalService.getMyProjects(authentication));
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<TicketDto>> getMyTickets(Authentication authentication) {
        return ResponseEntity.ok(clientPortalService.getMyTickets(authentication));
    }

    @PostMapping("/tickets")
    public ResponseEntity<TicketDto> createTicket(
            @Valid @RequestBody CreateClientTicketRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clientPortalService.createTicket(authentication, request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ProjectActivityResponseDto>> getProjectHistory(
            Authentication authentication,
            @RequestParam(required = false) Long projectId
    ) {
        if (projectId != null) {
            return ResponseEntity.ok(projectActivityService.getProjectActivitiesByClient(projectId, authentication));
        } else {
            return ResponseEntity.ok(projectActivityService.getClientActivities(authentication));
        }
    }
}