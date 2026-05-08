package com.admin.controller;

import com.admin.dto.nlq.NlqResolveRequest;
import com.admin.dto.nlq.NlqResolveResponse;
import com.admin.service.NlqNavigationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/nlq")
@RequiredArgsConstructor
public class NlqController {

    private final NlqNavigationService nlqNavigationService;

    @PostMapping("/resolve")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NlqResolveResponse> resolve(
            Authentication authentication,
            @Valid @RequestBody NlqResolveRequest request
    ) {
        return ResponseEntity.ok(nlqNavigationService.resolve(authentication, request));
    }
}
