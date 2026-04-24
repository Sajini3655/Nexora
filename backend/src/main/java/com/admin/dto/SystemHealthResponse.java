package com.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SystemHealthResponse {

    private String apiStatus;
    private String databaseStatus;
    private Long databaseLatencyMs;
    private String mailStatus;
    private String aiServiceStatus;
    private String uptime;
    private String overallStatus;
    private String lastCheckedAt;
    private Long refreshIntervalSeconds;
}