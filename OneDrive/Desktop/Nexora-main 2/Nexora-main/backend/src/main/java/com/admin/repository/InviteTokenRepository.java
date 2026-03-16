package com.admin.repository;

import com.admin.entity.InviteToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface InviteTokenRepository extends JpaRepository<InviteToken, Long> {

    Optional<InviteToken> findByToken(String token);

    @Transactional
    void deleteByUser_Id(Long userId);

    long countByUsedFalse();
}