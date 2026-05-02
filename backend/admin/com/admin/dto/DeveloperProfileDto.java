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
public class DeveloperProfileDto {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String location;
    private String specialization;
    private String timezone;
    private String bio;
    private ExperienceLevel experienceLevel;
    private AvailabilityStatus availabilityStatus;
    private Integer capacityPoints;
    private Integer weeklyCapacityHours;
    private Integer yearsOfExperience;
    private List<SkillDto> skills;
}
