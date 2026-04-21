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
    private String uptime;
    private String overallStatus;
}