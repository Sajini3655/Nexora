package com.admin.repository;

import com.admin.entity.ProjectActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectActivityRepository extends JpaRepository<ProjectActivity, Long> {

    @Query("SELECT pa FROM ProjectActivity pa " +
           "WHERE pa.project.client.id = :clientId " +
           "ORDER BY pa.createdAt DESC")
    List<ProjectActivity> findActivitiesByClientIdOrderByCreatedAtDesc(@Param("clientId") Long clientId);

    @Query("SELECT pa FROM ProjectActivity pa " +
           "WHERE pa.project.id = :projectId AND pa.project.client.id = :clientId " +
           "ORDER BY pa.createdAt DESC")
    List<ProjectActivity> findActivitiesByProjectIdAndClientIdOrderByCreatedAtDesc(
            @Param("projectId") Long projectId,
            @Param("clientId") Long clientId);

    @Query("SELECT pa FROM ProjectActivity pa " +
           "WHERE pa.project.client.id = :clientId " +
           "ORDER BY pa.createdAt DESC LIMIT :limit")
    List<ProjectActivity> findRecentActivitiesByClientId(@Param("clientId") Long clientId, @Param("limit") int limit);
}
