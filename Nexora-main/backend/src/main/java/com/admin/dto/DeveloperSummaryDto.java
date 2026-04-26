package com.admin.dto;

import com.admin.entity.ExperienceLevel;
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
    private ExperienceLevel experienceLevel;
    private Integer capacityPoints;
    private Integer activeWorkloadPoints;
    private List<SkillDto> skills;
}
