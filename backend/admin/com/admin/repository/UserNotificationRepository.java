package com.admin.repository;

import com.admin.entity.UserNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    /**
     * Find all notifications for a user, paginated and sorted by newest first
     */
    Page<UserNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find unread notifications for a user
     */
    Page<UserNotification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Count total unread notifications for a user
     */
    long countByUserIdAndReadFalse(Long userId);

    /**
     * Check if a notification with a given eventId already exists (idempotency)
     */
    boolean existsByEventId(String eventId);

    /**
     * Find by event ID
     */
    Optional<UserNotification> findByEventId(String eventId);

    /**
     * Mark a specific notification as read
     */
    @Modifying
    @Transactional
    @Query("UPDATE UserNotification un SET un.read = true WHERE un.id = :id AND un.userId = :userId")
    int markAsRead(@Param("id") Long id, @Param("userId") Long userId);

    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Transactional
    @Query("UPDATE UserNotification un SET un.read = true WHERE un.userId = :userId AND un.read = false")
    int markAllAsRead(@Param("userId") Long userId);

    /**
     * Delete a specific notification (if it belongs to the user)
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserNotification un WHERE un.id = :id AND un.userId = :userId")
    int deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    /**
     * Find notifications by aggregate type and ID (useful for context)
     */
    List<UserNotification> findByUserIdAndAggregateTypeAndAggregateId(Long userId, String aggregateType, Long aggregateId);

    /**
     * Find unread notifications by event type for a user
     */
    List<UserNotification> findByUserIdAndEventTypeAndReadFalse(Long userId, String eventType);
}
