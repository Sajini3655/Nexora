package com.admin.repository;

import com.admin.entity.Project;
import com.admin.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    long countByManager_Id(Long userId);

    List<Project> findByClient_IdOrderByCreatedAtDesc(Long clientId);

    // 🔥 ADD THIS
    List<Project> findByManagerOrderByCreatedAtDesc(User manager);

    Optional<Project> findByNameIgnoreCase(String name);
}