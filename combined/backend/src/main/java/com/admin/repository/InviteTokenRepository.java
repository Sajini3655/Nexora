package com.admin.repository;

import com.admin.entity.InviteToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface InviteTokenRepository extends JpaRepository<InviteToken, Long> {

    // Find invite token by token string (used in AuthService)
    Optional<InviteToken> findByToken(String token);

    // Delete all invite tokens for a given user ID
    @Transactional
    void deleteByUser_Id(Long userId);  // <-- Use this exact name
}
