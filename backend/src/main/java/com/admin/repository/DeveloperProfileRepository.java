package com.admin.repository;

import com.admin.entity.DeveloperProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeveloperProfileRepository extends JpaRepository<DeveloperProfile, Long> {
    Optional<DeveloperProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
