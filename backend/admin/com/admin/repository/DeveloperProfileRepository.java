package com.admin.repository;

import com.admin.entity.DeveloperProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeveloperProfileRepository extends JpaRepository<DeveloperProfile, Long> {

    long countByUser_Id(Long userId);

    // 🔥 ADD THESE
    Optional<DeveloperProfile> findByUser_Id(Long userId);

    Optional<DeveloperProfile> findByUserId(Long userId); // for your services
}