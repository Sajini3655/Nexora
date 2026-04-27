package com.admin.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreBreakdownDto {
    private double skillScore;      // 0..1
    private double workloadScore;   // 0..1
    private double experienceScore; // 0..1
}
