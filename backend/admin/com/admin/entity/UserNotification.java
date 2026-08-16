package com.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "user_notifications", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_user_read", columnList = "user_id, read"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User who receives this notification
     * Foreign key to users.id - not using @ManyToOne to avoid circular JPA serialization
     */
    @Column(nullable = false)
    private Long userId;

    /**
     * Event type identifier (e.g., TASK_ASSIGNED, TICKET_CREATED)
     */
    @Column(nullable = false, length = 50)
    private String eventType;

    /**
     * Short title/subject
     */
    @Column(nullable = false, length = 255)
    private String title;

    /**
     * Full message body
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    /**
     * Type of affected entity (TASK, TICKET, PROJECT, etc.)
     */
    @Column(length = 50)
    private String aggregateType;

    /**
     * ID of the affected entity
     */
    @Column
    private Long aggregateId;

    /**
     * JSON metadata for navigation/rendering context
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;

    /**
     * Whether this notification has been read by the user
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean read = false;

    /**
     * When the notification was created
     */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * For idempotency - prevent duplicate notifications from same event
     */
    @Column(unique = true, length = 36)
    private String eventId;
}
