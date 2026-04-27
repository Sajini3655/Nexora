package com.admin.dto;

import com.admin.entity.ExperienceLevel;
import com.admin.entity.AvailabilityStatus;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeveloperSummaryDto {
    private Long id;
    private String name;
    private String email;
    private String specialization;
    private String timezone;
    private ExperienceLevel experienceLevel;
    private AvailabilityStatus availabilityStatus;
    private Integer capacityPoints;
    private Integer weeklyCapacityHours;
    private Integer yearsOfExperience;
    private Integer activeWorkloadPoints;
    private List<SkillDto> skills;
}
