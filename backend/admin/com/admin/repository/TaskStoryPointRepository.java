package com.admin.repository;

import com.admin.entity.StoryPointStatus;
import com.admin.entity.TaskStoryPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Collection;

public interface TaskStoryPointRepository extends JpaRepository<TaskStoryPoint, Long> {

    List<TaskStoryPoint> findByTaskIdOrderByCreatedAtAsc(Long taskId);

    long countByTaskId(Long taskId);

    long countByTaskIdAndStatus(Long taskId, StoryPointStatus status);

    long countByTaskAssignedToId(Long developerId);

    long countByTaskAssignedToIdAndStatus(Long developerId, StoryPointStatus status);

    long countByTaskProjectId(Long projectId);

    long countByTaskProjectIdAndStatus(Long projectId, StoryPointStatus status);

    interface TaskStoryPointSummary {
        Long getTaskId();

        Long getTotalStoryPoints();

        Long getCompletedStoryPoints();

        Long getTotalPointValue();

        Long getCompletedPointValue();
    }

    @Query("""
        select
            sp.task.id as taskId,
            count(sp.id) as totalStoryPoints,
            sum(case when sp.status = com.admin.entity.StoryPointStatus.DONE then 1 else 0 end) as completedStoryPoints,
            coalesce(sum(coalesce(sp.pointValue, 0)), 0) as totalPointValue,
            coalesce(sum(case when sp.status = com.admin.entity.StoryPointStatus.DONE then coalesce(sp.pointValue, 0) else 0 end), 0) as completedPointValue
        from TaskStoryPoint sp
        where sp.task.id in :taskIds
        group by sp.task.id
    """)
    List<TaskStoryPointSummary> summarizeByTaskIds(Collection<Long> taskIds);
}
