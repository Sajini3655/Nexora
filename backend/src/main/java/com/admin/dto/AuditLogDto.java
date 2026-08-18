package com.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuditLogDto {
    private String action;
    private String actorEmail;
    private String targetEmail;
    private String details;
    private String createdAt;
}