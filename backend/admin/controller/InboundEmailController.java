package com.admin.controller;

import com.admin.dto.InboundEmailTicketRequest;
import com.admin.dto.InboundEmailTicketResponse;
import com.admin.service.EmailTicketIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inbound/emails")
@RequiredArgsConstructor
public class InboundEmailController {

    private final EmailTicketIngestionService emailTicketIngestionService;

    @Value("${app.inbound.email.api-key:}")
    private String inboundApiKey;

    @PostMapping("/tickets")
    public ResponseEntity<InboundEmailTicketResponse> ingestEmail(
            @RequestHeader(value = "X-Inbound-Api-Key", required = false) String apiKey,
            @RequestBody InboundEmailTicketRequest request
    ) {
        if (inboundApiKey == null || inboundApiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(InboundEmailTicketResponse.builder()
                            .ignored(true)
                            .reason("Inbound email API key is not configured")
                            .build());
        }

        if (!inboundApiKey.equals(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(InboundEmailTicketResponse.builder()
                            .ignored(true)
                            .reason("Invalid API key")
                            .build());
        }

        InboundEmailTicketResponse response = emailTicketIngestionService.ingest(request);
        if (response.isIgnored()) {
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
