package com.admin.repository;

import com.admin.entity.Project;
import com.admin.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    long countByManager_Id(Long userId);

    List<Project> findByClient_IdOrderByCreatedAtDesc(Long clientId);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.tasks WHERE p.manager = :manager ORDER BY p.createdAt DESC")
    List<Project> findByManagerOrderByCreatedAtDesc(@Param("manager") User manager);

    Optional<Project> findByNameIgnoreCase(String name);
}