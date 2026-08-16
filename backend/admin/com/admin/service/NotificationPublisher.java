package com.admin.service;

import com.admin.config.RabbitMqConfig;
import com.admin.dto.NotificationEventDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Publish a notification event to RabbitMQ.
     * The NotificationConsumer will pick it up, validate it, store it in PostgreSQL,
     * and deliver it through WebSocket to the target user.
     *
     * @param event The notification event to publish
     */
    public void publish(NotificationEventDto event) {
        try {
            // Ensure event has an ID for idempotency
            if (event.getEventId() == null) {
                event.setEventId(UUID.randomUUID().toString());
            }

            // Ensure timestamp is set
            if (event.getTimestamp() == null) {
                event.setTimestamp(LocalDateTime.now());
            }

            // Determine routing key based on event type
            String routingKey = determineRoutingKey(event.getEventType());

            log.debug("Publishing notification event: eventType={}, targetUserId={}, routingKey={}, eventId={}",
                event.getEventType(), event.getTargetUserId(), routingKey, event.getEventId());

            rabbitTemplate.convertAndSend(
                RabbitMqConfig.NOTIFICATIONS_EXCHANGE,
                routingKey,
                event
            );

            log.info("Notification event published successfully: eventId={}, eventType={}, targetUserId={}",
                event.getEventId(), event.getEventType(), event.getTargetUserId());
        } catch (Exception e) {
            log.error("Failed to publish notification event: eventType={}, targetUserId={}, error={}",
                event.getEventType(), event.getTargetUserId(), e.getMessage(), e);
            // Don't throw - allow business operation to succeed even if notification fails
        }
    }

    /**
     * Determine routing key based on event type prefix
     */
    private String determineRoutingKey(String eventType) {
        if (eventType == null || eventType.isBlank()) {
            return RabbitMqConfig.ROUTING_KEY_NOTIFICATION_SYSTEM;
        }

        String lowerType = eventType.toLowerCase();

        if (lowerType.startsWith("user")) {
            return RabbitMqConfig.ROUTING_KEY_NOTIFICATION_USER;
        } else if (lowerType.startsWith("project")) {
            return RabbitMqConfig.ROUTING_KEY_NOTIFICATION_PROJECT;
        } else if (lowerType.startsWith("task")) {
            return RabbitMqConfig.ROUTING_KEY_NOTIFICATION_TASK;
        } else if (lowerType.startsWith("ticket")) {
            return RabbitMqConfig.ROUTING_KEY_NOTIFICATION_TICKET;
        } else if (lowerType.startsWith("timesheet")) {
            return RabbitMqConfig.ROUTING_KEY_NOTIFICATION_TIMESHEET;
        } else if (lowerType.startsWith("chat")) {
            return RabbitMqConfig.ROUTING_KEY_NOTIFICATION_CHAT;
        }

        return RabbitMqConfig.ROUTING_KEY_NOTIFICATION_SYSTEM;
    }
}
