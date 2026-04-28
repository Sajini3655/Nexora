package com.admin.repository;

import com.admin.entity.TimesheetEntry;
import com.admin.entity.User;
import com.admin.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TimesheetEntryRepository extends JpaRepository<TimesheetEntry, Long> {

    // Find by developer
    Page<TimesheetEntry> findByDeveloperOrderByWorkDateDesc(User developer, Pageable pageable);

    List<TimesheetEntry> findByDeveloperOrderByWorkDateDesc(User developer);

    // Find by project
    List<TimesheetEntry> findByProjectOrderByWorkDateDesc(Project project);

    // Find by date range
    List<TimesheetEntry> findByWorkDateBetweenOrderByWorkDateDesc(LocalDate startDate, LocalDate endDate);

    // Find by developer and date range
    @Query("SELECT t FROM TimesheetEntry t WHERE t.developer = :developer AND t.workDate BETWEEN :startDate AND :endDate ORDER BY t.workDate DESC")
    List<TimesheetEntry> findByDeveloperAndDateRange(
            @Param("developer") User developer,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Find by status
    List<TimesheetEntry> findByStatusOrderByWorkDateDesc(TimesheetEntry.TimesheetStatus status);

    // Find submitted timesheets for approval
    @Query("SELECT t FROM TimesheetEntry t WHERE t.status = 'SUBMITTED' ORDER BY t.workDate DESC")
    List<TimesheetEntry> findSubmittedTimesheets();

    // Find by project and developer
    List<TimesheetEntry> findByProjectAndDeveloperOrderByWorkDateDesc(Project project, User developer);

    // Count timesheets for developer
    long countByDeveloper(User developer);

    // Get total hours for developer
    @Query("SELECT COALESCE(SUM(t.hoursWorked), 0.0) FROM TimesheetEntry t WHERE t.developer = :developer AND t.status = 'APPROVED'")
    Double getTotalApprovedHoursByDeveloper(@Param("developer") User developer);

    // Get total hours for project
    @Query("SELECT COALESCE(SUM(t.hoursWorked), 0.0) FROM TimesheetEntry t WHERE t.project = :project AND t.status = 'APPROVED'")
    Double getTotalApprovedHoursByProject(@Param("project") Project project);

    // Paginated search with filters
    @Query("SELECT t FROM TimesheetEntry t WHERE " +
           "(:developerId IS NULL OR t.developer.id = :developerId) AND " +
           "(:projectId IS NULL OR t.project.id = :projectId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:startDate IS NULL OR t.workDate >= :startDate) AND " +
           "(:endDate IS NULL OR t.workDate <= :endDate) " +
           "ORDER BY t.workDate DESC")
    Page<TimesheetEntry> findByFilters(
            @Param("developerId") Long developerId,
            @Param("projectId") Long projectId,
            @Param("status") TimesheetEntry.TimesheetStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );
}
