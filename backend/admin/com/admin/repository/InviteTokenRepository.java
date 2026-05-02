package com.admin.repository;

import com.admin.entity.InviteToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InviteTokenRepository extends JpaRepository<InviteToken, Long> {

    Optional<InviteToken> findByToken(String token);

    // ✅ FIX: Add this method
    long countByUsedFalse();

    // Optional (good to have)
    long countByUsedTrue();

    void deleteByUser_Id(Long userId);
}