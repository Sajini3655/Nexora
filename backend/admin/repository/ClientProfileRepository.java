package com.admin.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.admin.entity.ClientProfile;

public interface ClientProfileRepository extends JpaRepository<ClientProfile, Long> {

    Optional<ClientProfile> findByUser_Id(Long userId);

    Optional<ClientProfile> findByUserId(Long userId);
}
