package com.admin.repository;

import com.admin.entity.TaskItem;
import com.admin.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TaskRepository extends JpaRepository<TaskItem, Long> {

    long countByCreatedBy_Id(Long userId);
    long countByAssignedTo_Id(Long userId);

    // 🔥 ADD THESE

    List<TaskItem> findByCreatedById(Long userId);

    List<TaskItem> findByAssignedToId(Long userId);

    boolean existsByProject_IdAndAssignedTo_Id(Long projectId, Long assignedToId);

    @Query("""
        SELECT COALESCE(SUM(t.estimatedPoints), 0)
        FROM TaskItem t
        WHERE t.assignedTo.id = :userId AND t.status = :status
    """)
    Integer sumActivePoints(Long userId, TaskStatus status);
}