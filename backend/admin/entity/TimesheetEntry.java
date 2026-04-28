package com.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * TimesheetEntry - Tracks billable hours for developers on projects/tasks
 *
 * Status Flow: DRAFT -> SUBMITTED -> APPROVED/REJECTED
 * - Developer creates draft and submits
 * - Manager approves or rejects with optional reason
 * - Admin views all timesheets
 */
@Entity
@Table(name = "timesheet_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User developer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private TaskItem task;

    @Column(nullable = false)
    private LocalDate workDate;

    @Column(nullable = false)
    private Double hoursWorked;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TimesheetStatus status = TimesheetStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column
    private LocalDateTime approvedAt;

    @Column(length = 1000)
    private String rejectionReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = TimesheetStatus.DRAFT;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TimesheetStatus {
        DRAFT,
        SUBMITTED,
        APPROVED,
        REJECTED
    }
}
