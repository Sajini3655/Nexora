package com.admin.repository;

import com.admin.entity.TaskItem;
import com.admin.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface TaskRepository extends JpaRepository<TaskItem, Long> {

    long countByCreatedBy_Id(Long userId);
    long countByAssignedTo_Id(Long userId);

    // 🔥 ADD THESE

    List<TaskItem> findByCreatedById(Long userId);

    List<TaskItem> findByAssignedToId(Long userId);

    List<TaskItem> findByProject_Id(Long projectId);

    long countByAssignedTo_IdAndStatusIn(Long userId, Collection<TaskStatus> statuses);

    long countByProject_Id(Long projectId);

    long countByProject_IdAndStatusIn(Long projectId, Collection<TaskStatus> statuses);

    boolean existsByProject_IdAndAssignedTo_Id(Long projectId, Long assignedToId);

    @Query("""
        SELECT COALESCE(SUM(t.estimatedPoints), 0)
        FROM TaskItem t
        WHERE t.assignedTo.id = :userId AND t.status NOT IN :completedStatuses
    """)
    Integer sumActivePoints(Long userId, Collection<TaskStatus> completedStatuses);
}