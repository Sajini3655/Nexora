package com.admin.repository;

import com.admin.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findFirstByProject_IdAndEndedFalseOrderByStartedAtDesc(Long projectId);
    
    @Query("SELECT s FROM ChatSession s WHERE s.project.id = :projectId ORDER BY s.startedAt DESC")
    List<ChatSession> findByProject_IdOrderByStartedAtDesc(@Param("projectId") Long projectId);
    
    List<ChatSession> findByProject_IdAndEndedFalseOrderByStartedAtDesc(Long projectId);
}