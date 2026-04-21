package com.admin.repository;

import com.admin.entity.Project;
import com.admin.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    long countByManager_Id(Long userId);

    // 🔥 ADD THIS
    List<Project> findByManagerOrderByCreatedAtDesc(User manager);
}