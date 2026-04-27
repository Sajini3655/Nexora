package com.admin.repository;

import com.admin.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findFirstByProject_IdAndEndedFalseOrderByStartedAtDesc(Long projectId);
}