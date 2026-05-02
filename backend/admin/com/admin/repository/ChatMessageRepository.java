package com.admin.repository;

import com.admin.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    interface SessionMessageCountView {
        Long getSessionId();
        Long getMessageCount();
    }

    interface SessionLastMessageView {
        Long getSessionId();
        String getContent();
    }

    List<ChatMessage> findBySession_IdOrderByCreatedAtAsc(Long sessionId);

    long countBySession_Id(Long sessionId);

    Optional<ChatMessage> findTopBySession_IdOrderByCreatedAtDesc(Long sessionId);

        @Query("SELECT m.session.id AS sessionId, COUNT(m.id) AS messageCount " +
            "FROM ChatMessage m " +
            "WHERE m.session.id IN :sessionIds " +
            "GROUP BY m.session.id")
        List<SessionMessageCountView> countBySessionIds(@Param("sessionIds") List<Long> sessionIds);

        @Query("SELECT m.session.id AS sessionId, m.content AS content " +
            "FROM ChatMessage m " +
            "WHERE m.session.id IN :sessionIds " +
            "AND m.createdAt = (SELECT MAX(m2.createdAt) FROM ChatMessage m2 WHERE m2.session.id = m.session.id) " +
            "AND m.id = (SELECT MAX(m3.id) FROM ChatMessage m3 WHERE m3.session.id = m.session.id AND m3.createdAt = m.createdAt)")
        List<SessionLastMessageView> findLatestMessageBySessionIds(@Param("sessionIds") List<Long> sessionIds);

    @Query("SELECT m FROM ChatMessage m WHERE m.session.id = :sessionId ORDER BY m.createdAt ASC")
    List<ChatMessage> findMessagesForSession(@Param("sessionId") Long sessionId);
}