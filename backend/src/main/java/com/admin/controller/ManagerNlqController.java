package com.admin.controller;

import com.admin.dto.NlqResolveRequest;
import com.admin.dto.NlqResolveResponse;
import com.admin.service.nlq.ManagerNlqNavigationService;
import org.springframework.web.bind.annotation.*;

/**
 * Manager NLQ navigation endpoint.
 *
 * SecurityConfig already protects /api/manager/** for MANAGER role.
 */
@RestController
@RequestMapping("/api/manager/nlq")
public class ManagerNlqController {

    private final ManagerNlqNavigationService service;

    public ManagerNlqController(ManagerNlqNavigationService service) {
        this.service = service;
    }

    @PostMapping("/resolve")
    public NlqResolveResponse resolve(@RequestBody NlqResolveRequest req) {
        return service.resolve(req);
    }
}