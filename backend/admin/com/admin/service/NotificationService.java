package com.admin.service;

import com.admin.dto.NotificationResponseDto;
import com.admin.entity.User;
import com.admin.entity.UserNotification;
import com.admin.repository.UserNotificationRepository;
import com.admin.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /**
     * Get all notifications for a user, paginated
     * Requires that the authenticated username matches the owner
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponseDto> getUserNotifications(String username, Pageable pageable) {
        User user = userRepository.findByEmailIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Page<UserNotification> notifications = notificationRepository
            .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);

        return notifications.map(this::toResponseDto);
    }

    /**
     * Get unread notifications for a user, paginated
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponseDto> getUnreadNotifications(String username, Pageable pageable) {
        User user = userRepository.findByEmailIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Page<UserNotification> notifications = notificationRepository
            .findByUserIdAndReadFalseOrderByCreatedAtDesc(user.getId(), pageable);

        return notifications.map(this::toResponseDto);
    }

    /**
     * Get count of unread notifications for a user
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String username) {
        User user = userRepository.findByEmailIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    /**
     * Mark a single notification as read
     * Only allows the notification owner to update
     */
    @Transactional
    public boolean markAsRead(Long notificationId, String username) {
        User user = userRepository.findByEmailIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        int updatedCount = notificationRepository.markAsRead(notificationId, user.getId());

        if (updatedCount > 0) {
            log.info("Notification marked as read: notificationId={}, userId={}", notificationId, user.getId());
            return true;
        }

        log.warn("Failed to mark notification as read: notificationId={}, userId={} (not owner)", notificationId, user.getId());
        return false;
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public int markAllAsRead(String username) {
        User user = userRepository.findByEmailIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        int count = notificationRepository.markAllAsRead(user.getId());
        log.info("All notifications marked as read: userId={}, count={}", user.getId(), count);

        return count;
    }

    /**
     * Delete a single notification
     * Only allows the notification owner to delete
     */
    @Transactional
    public boolean deleteNotification(Long notificationId, String username) {
        User user = userRepository.findByEmailIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        int deletedCount = notificationRepository.deleteByIdAndUserId(notificationId, user.getId());

        if (deletedCount > 0) {
            log.info("Notification deleted: notificationId={}, userId={}", notificationId, user.getId());
            return true;
        }

        log.warn("Failed to delete notification: notificationId={}, userId={} (not owner)", notificationId, user.getId());
        return false;
    }

    /**
     * Delete all read notifications for a user
     */
    @Transactional
    public int deleteReadNotifications(String username) {
        User user = userRepository.findByEmailIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all read notifications and delete them
        Page<UserNotification> readNotifications = notificationRepository
            .findByUserIdAndReadFalseOrderByCreatedAtDesc(user.getId(), Pageable.unpaged());

        List<UserNotification> toDelete = readNotifications.getContent().stream()
            .filter(n -> Boolean.TRUE.equals(n.getRead()))
            .collect(Collectors.toList());

        notificationRepository.deleteAll(toDelete);

        log.info("Read notifications deleted: userId={}, count={}", user.getId(), toDelete.size());
        return toDelete.size();
    }

    /**
     * Convert UserNotification entity to response DTO
     */
    private NotificationResponseDto toResponseDto(UserNotification notification) {
        Map<String, Object> metadata = deserializeMetadata(notification.getMetadata());

        return NotificationResponseDto.builder()
            .id(notification.getId())
            .eventType(notification.getEventType())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .aggregateType(notification.getAggregateType())
            .aggregateId(notification.getAggregateId())
            .metadata(metadata)
            .read(notification.getRead())
            .createdAt(notification.getCreatedAt())
            .build();
    }

    /**
     * Deserialize metadata from JSON string to map
     */
    private Map<String, Object> deserializeMetadata(String metadata) {
        try {
            if (metadata == null || metadata.isBlank() || metadata.equals("{}")) {
                return Map.of();
            }
            return objectMapper.readValue(metadata, Map.class);
        } catch (Exception e) {
            log.warn("Failed to deserialize metadata: {}", e.getMessage());
            return Map.of();
        }
    }
}
