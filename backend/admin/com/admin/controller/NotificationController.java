package com.admin.controller;

import com.admin.dto.NotificationResponseDto;
import com.admin.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get all notifications for the authenticated user, paginated
     * Newest first
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

        String username = authentication.getName();
        Pageable pageable = PageRequest.of(page, size);

        Page<NotificationResponseDto> notifications = notificationService.getUserNotifications(username, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", notifications.getContent());
        response.put("page", notifications.getNumber());
        response.put("size", notifications.getSize());
        response.put("totalElements", notifications.getTotalElements());
        response.put("totalPages", notifications.getTotalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * Get unread notifications for the authenticated user
     */
    @GetMapping("/unread")
    public ResponseEntity<Map<String, Object>> getUnreadNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

        String username = authentication.getName();
        Pageable pageable = PageRequest.of(page, size);

        Page<NotificationResponseDto> notifications = notificationService.getUnreadNotifications(username, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", notifications.getContent());
        response.put("page", notifications.getNumber());
        response.put("size", notifications.getSize());
        response.put("totalElements", notifications.getTotalElements());
        response.put("totalPages", notifications.getTotalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * Get count of unread notifications for the authenticated user
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

        String username = authentication.getName();
        long count = notificationService.getUnreadCount(username);

        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", count);

        return ResponseEntity.ok(response);
    }

    /**
     * Mark a specific notification as read
     * Only the notification owner can mark it as read
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

        String username = authentication.getName();
        boolean updated = notificationService.markAsRead(id, username);

        if (!updated) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Notification not found"));
        }

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Notification marked as read");

        return ResponseEntity.ok(response);
    }

    /**
     * Mark all notifications as read for the authenticated user
     */
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

        String username = authentication.getName();
        int count = notificationService.markAllAsRead(username);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "All notifications marked as read");
        response.put("count", count);

        return ResponseEntity.ok(response);
    }

    /**
     * Delete a specific notification
     * Only the notification owner can delete it
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

        String username = authentication.getName();
        boolean deleted = notificationService.deleteNotification(id, username);

        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Notification not found"));
        }

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Notification deleted");

        return ResponseEntity.ok(response);
    }

    /**
     * Delete all read notifications for the authenticated user
     */
    @DeleteMapping("/old-read")
    public ResponseEntity<Map<String, Object>> deleteOldReadNotifications(
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

        String username = authentication.getName();
        int count = notificationService.deleteReadNotifications(username);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Old read notifications deleted");
        response.put("count", count);

        return ResponseEntity.ok(response);
    }
}
