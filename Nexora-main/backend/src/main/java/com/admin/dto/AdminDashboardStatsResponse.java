package com.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdminDashboardStatsResponse {

    private long totalUsers;

    private long admins;
    private long managers;
    private long developers;
    private long clients;

    private long enabledUsers;
    private long disabledUsers;

    private long newUsersToday;
    private long newUsersThisWeek;

    private long pendingInvites;
}