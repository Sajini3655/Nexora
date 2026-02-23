package com.admin.repository;

import com.admin.entity.TaskSubtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskSubtaskRepository extends JpaRepository<TaskSubtask, Long> {

    List<TaskSubtask> findByTaskIdOrderByIdAsc(Long taskId);

    long countByTaskId(Long taskId);

    @Query("select coalesce(sum(coalesce(s.points, 0)), 0) from TaskSubtask s where s.task.id = :taskId")
    int sumPoints(@Param("taskId") Long taskId);

    @Query("select coalesce(sum(coalesce(s.points, 0)), 0) from TaskSubtask s where s.task.id = :taskId and s.done = true")
    int sumDonePoints(@Param("taskId") Long taskId);
}
