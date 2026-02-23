package com.admin.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillDto {
    private String name;
    private Integer level; // 1..5
}
