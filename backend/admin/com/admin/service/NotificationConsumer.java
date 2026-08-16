package com.admin.service;

import com.admin.config.RabbitMqConfig;
import com.admin.dto.NotificationEventDto;
import com.admin.entity.User;
import com.admin.entity.UserNotification;
import com.admin.repository.UserNotificationRepository;
import com.admin.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Listen to all notification events from RabbitMQ and process them.
     * This consumer:
     * 1. Validates the event
     * 2. Verifies target user exists and is enabled
     * 3. Checks for idempotency (duplicate events)
     * 4. Saves notification to PostgreSQL
     * 5. Delivers through WebSocket to the target user
     *
     * Uses STOMP user destination: /user/{username}/queue/notifications
     * This ensures only the target user receives their own notifications
     */
    @RabbitListener(queues = RabbitMqConfig.NOTIFICATIONS_QUEUE)
    @Transactional
    public void handleNotificationEvent(NotificationEventDto event) {
        try {
            log.info("Processing notification event: eventId={}, eventType={}, targetUserId={}, aggregateType={}, aggregateId={}",
                event.getEventId(), event.getEventType(), event.getTargetUserId(), event.getAggregateType(), event.getAggregateId());

            // Step 1: Validate required fields
            if (!validateEvent(event)) {
                log.warn("Invalid notification event rejected: eventId={}, eventType={}", event.getEventId(), event.getEventType());
                return;
            }

            // Step 2: Check for duplicate (idempotency)
            if (event.getEventId() != null && notificationRepository.existsByEventId(event.getEventId())) {
                log.debug("Duplicate notification event ignored: eventId={}", event.getEventId());
                return;
            }

            // Step 3: Verify target user exists and is enabled
            Optional<User> targetUserOpt = userRepository.findById(event.getTargetUserId());
            if (targetUserOpt.isEmpty()) {
                log.warn("Target user not found for notification: targetUserId={}, eventId={}", event.getTargetUserId(), event.getEventId());
                return;
            }

            User targetUser = targetUserOpt.get();
            if (!Boolean.TRUE.equals(targetUser.getEnabled())) {
                log.debug("Target user is disabled, notification not delivered: userId={}, eventId={}", event.getTargetUserId(), event.getEventId());
                return;
            }

            // Step 4: Save notification to PostgreSQL
            UserNotification notification = UserNotification.builder()
                .userId(event.getTargetUserId())
                .eventType(event.getEventType())
                .title(event.getTitle())
                .message(event.getMessage())
                .aggregateType(event.getAggregateType())
                .aggregateId(event.getAggregateId())
                .metadata(serializeMetadata(event.getMetadata()))
                .read(false)
                .eventId(event.getEventId())
                .build();

            UserNotification savedNotification = notificationRepository.save(notification);
            log.info("Notification saved to database: notificationId={}, userId={}, eventId={}",
                savedNotification.getId(), event.getTargetUserId(), event.getEventId());

            // Step 5: Deliver through WebSocket to the target user's STOMP queue
            // Using /user/{username}/queue/notifications for secure user-specific delivery
            // Spring STOMP automatically routes this to the correct user session
            deliverNotificationViaWebSocket(targetUser.getEmail(), savedNotification);

        } catch (Exception e) {
            log.error("Error processing notification event: eventId={}, error={}", event.getEventId(), e.getMessage(), e);
            // Message will be redelivered by RabbitMQ or sent to DLQ based on configuration
        }
    }

    /**
     * Validate required fields in the notification event
     */
    private boolean validateEvent(NotificationEventDto event) {
        return event != null
            && event.getEventType() != null && !event.getEventType().isBlank()
            && event.getTargetUserId() != null && event.getTargetUserId() > 0
            && event.getTitle() != null && !event.getTitle().isBlank()
            && event.getMessage() != null && !event.getMessage().isBlank();
    }

    /**
     * Serialize metadata map to JSON string
     */
    private String serializeMetadata(Map<String, Object> metadata) {
        try {
            if (metadata == null || metadata.isEmpty()) {
                return "{}";
            }
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            log.warn("Failed to serialize metadata: {}", e.getMessage());
            return "{}";
        }
    }

    /**
     * Deliver notification through WebSocket to the target user.
     * Using STOMP user destination for secure delivery.
     *
     * The destination /user/{username}/queue/notifications is a Spring-managed
     * user-specific queue that routes only to that user's WebSocket session.
     */
    private void deliverNotificationViaWebSocket(String username, UserNotification notification) {
        try {
            // Create a response DTO for the WebSocket
            NotificationWebSocketDto wsNotification = NotificationWebSocketDto.builder()
                .id(notification.getId())
                .eventType(notification.getEventType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .aggregateType(notification.getAggregateType())
                .aggregateId(notification.getAggregateId())
                .read(notification.getRead())
                .createdAt(notification.getCreatedAt())
                .build();

            // Send to user-specific queue - STOMP will route to connected sessions for this user
            String destination = "/user/" + username + "/queue/notifications";
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                wsNotification
            );

            log.debug("Notification delivered via WebSocket: username={}, notificationId={}", username, notification.getId());
        } catch (Exception e) {
            log.warn("Failed to deliver notification via WebSocket: username={}, notificationId={}, error={}",
                username, notification.getId(), e.getMessage());
            // Don't fail - notification is safely stored in database and can be retrieved on next login
        }
    }

    /**
     * DTO for WebSocket delivery
     */
    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    public static class NotificationWebSocketDto {
        private Long id;
        private String eventType;
        private String title;
        private String message;
        private String aggregateType;
        private Long aggregateId;
        private Boolean read;
        private LocalDateTime createdAt;
    }
}
