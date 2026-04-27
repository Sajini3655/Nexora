package com.admin.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.admin.dto.ClientProfileDto;
import com.admin.service.ClientProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/client/profile")
@RequiredArgsConstructor
public class ClientProfileController {

    private final ClientProfileService profileService;

    @GetMapping
    public ResponseEntity<ClientProfileDto> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(profileService.getMyProfile(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<ClientProfileDto> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody ClientProfileDto request
    ) {
        return ResponseEntity.ok(profileService.updateMyProfile(authentication.getName(), request));
    }

    @PostMapping("/picture")
    public ResponseEntity<Map<String, String>> uploadProfilePicture(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            if (authentication == null || authentication.getName() == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Unauthorized");
                return ResponseEntity.status(401).body(errorResponse);
            }

            String url = profileService.uploadProfilePicture(authentication.getName(), file);
            Map<String, String> response = new HashMap<>();
            response.put("url", url);
            response.put("profilePicture", url);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(400).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to upload profile picture: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
