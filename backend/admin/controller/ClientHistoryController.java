package com.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.admin.dto.ClientHistoryResponse;
import com.admin.service.ClientHistoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/client/history")
@RequiredArgsConstructor
public class ClientHistoryController {

    private final ClientHistoryService historyService;

    @GetMapping
    public ResponseEntity<ClientHistoryResponse> getMyHistory(Authentication authentication) {
        return ResponseEntity.ok(historyService.getMyHistory(authentication.getName()));
    }
}
