package com.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetSummaryResponse {

    private long draftCount;
    private long submittedCount;
    private long approvedCount;
    private long rejectedCount;
    private BigDecimal totalHours;
    private long totalEntries;
}