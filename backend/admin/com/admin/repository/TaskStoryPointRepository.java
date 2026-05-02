package com.admin.repository;

import com.admin.entity.StoryPointStatus;
import com.admin.entity.TaskStoryPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskStoryPointRepository extends JpaRepository<TaskStoryPoint, Long> {

    List<TaskStoryPoint> findByTaskIdOrderByCreatedAtAsc(Long taskId);

    long countByTaskId(Long taskId);

    long countByTaskIdAndStatus(Long taskId, StoryPointStatus status);

    long countByTaskAssignedToId(Long developerId);

    long countByTaskAssignedToIdAndStatus(Long developerId, StoryPointStatus status);

    long countByTaskProjectId(Long projectId);

    long countByTaskProjectIdAndStatus(Long projectId, StoryPointStatus status);
}
