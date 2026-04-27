package com.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "developer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeveloperProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExperienceLevel experienceLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AvailabilityStatus availabilityStatus;

    /**
     * Capacity in story points (or "effort points") for active work.
     * Used by the matching algorithm as a simple workload cap.
     */
    @Column(nullable = false)
    private Integer capacityPoints;

    @Column(nullable = false)
    private Integer weeklyCapacityHours;

    @Column(nullable = false)
    private Integer yearsOfExperience;

    // Extra profile fields (developer UI)
    private String phone;
    private String location;
    private String specialization;
    private String timezone;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DeveloperSkill> skills = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (experienceLevel == null) experienceLevel = ExperienceLevel.JUNIOR;
        if (availabilityStatus == null) availabilityStatus = AvailabilityStatus.AVAILABLE;
        if (capacityPoints == null) capacityPoints = 20;
        if (weeklyCapacityHours == null) weeklyCapacityHours = 40;
        if (yearsOfExperience == null) yearsOfExperience = 1;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
