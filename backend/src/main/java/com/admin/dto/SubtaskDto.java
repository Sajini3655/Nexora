package com.admin.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubtaskDto {
    private Long id;
    private String title;
    private Integer points;
    private Boolean done;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
