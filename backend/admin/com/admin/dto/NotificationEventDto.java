package com.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEventDto {

    /**
     * Unique event ID for idempotency - prevents duplicate processing
     */
    @JsonProperty("event_id")
    private String eventId;

    /**
     * Type of notification event (e.g., TASK_ASSIGNED, TICKET_CREATED)
     */
    @JsonProperty("event_type")
    private String eventType;

    /**
     * User ID who triggered/created this event
     */
    @JsonProperty("source_user_id")
    private Long sourceUserId;

    /**
     * User ID who should receive this notification
     * Determined by backend business logic, not frontend
     */
    @JsonProperty("target_user_id")
    private Long targetUserId;

    /**
     * Type of aggregate affected (TASK, TICKET, PROJECT, etc.)
     */
    @JsonProperty("aggregate_type")
    private String aggregateType;

    /**
     * ID of the affected aggregate entity
     */
    @JsonProperty("aggregate_id")
    private Long aggregateId;

    /**
     * Short title/subject of the notification
     */
    @JsonProperty("title")
    private String title;

    /**
     * Full message body
     */
    @JsonProperty("message")
    private String message;

    /**
     * Additional contextual data (JSON)
     */
    @JsonProperty("metadata")
    @Builder.Default
    private Map<String, Object> metadata = Map.of();

    /**
     * When the event was created
     */
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
}
