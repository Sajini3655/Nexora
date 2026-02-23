package com.admin.repository;

import com.admin.entity.TaskItem;
import com.admin.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<TaskItem, Long> {

    List<TaskItem> findByAssignedToId(Long userId);

    List<TaskItem> findByCreatedById(Long userId);

    List<TaskItem> findByAssignedToIdAndStatusNot(Long userId, TaskStatus status);

    @Query("select coalesce(sum(coalesce(t.estimatedPoints, 1)), 0) from TaskItem t where t.assignedTo.id = :userId and t.status <> :done")
    int sumActivePoints(@Param("userId") Long userId, @Param("done") TaskStatus done);
}
