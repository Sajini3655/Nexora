package com.admin.repository;

import com.admin.entity.TimesheetEntry;
import com.admin.entity.TimesheetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TimesheetEntryRepository extends JpaRepository<TimesheetEntry, Long> {

    List<TimesheetEntry> findByDeveloperIdOrderByWorkDateDesc(Long developerId);

    List<TimesheetEntry> findByDeveloperIdAndStatusOrderByWorkDateDesc(Long developerId, TimesheetStatus status);

    List<TimesheetEntry> findByStatusOrderByWorkDateDesc(TimesheetStatus status);

    List<TimesheetEntry> findAllByOrderByWorkDateDesc();

    @Query("""
        SELECT t FROM TimesheetEntry t
        WHERE t.status <> com.admin.entity.TimesheetStatus.DRAFT
          AND (
                t.project.manager.id = :managerId
                OR (t.task IS NOT NULL AND t.task.project IS NOT NULL AND t.task.project.manager.id = :managerId)
          )
        ORDER BY t.workDate DESC, t.updatedAt DESC
    """)
    List<TimesheetEntry> findVisibleForManagerOrderByWorkDateDesc(@Param("managerId") Long managerId);
}