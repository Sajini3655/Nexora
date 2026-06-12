package com.admin.repository;

import com.admin.entity.InviteToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InviteTokenRepository extends JpaRepository<InviteToken, Long> {

    Optional<InviteToken> findByToken(String token);

    long countByUsedFalse();

    long countByUsedTrue();

    void deleteByUser_Id(Long userId);
}
