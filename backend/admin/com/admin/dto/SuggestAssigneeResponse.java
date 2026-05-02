package com.admin.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestAssigneeResponse {
    private DeveloperSummaryDto recommendedDeveloper;
    private Integer confidence; // 0..100
    private String explanation;

    private List<String> requiredSkills;
    private List<String> matchedSkills;
    private List<String> missingSkills;

    private ScoreBreakdownDto breakdown;
}
