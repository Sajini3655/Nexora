package com.admin.dto.nlq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiNlqResolveResponse {
    private String action; // NAVIGATE | SWITCH_ROLE | UNKNOWN
    private String destinationId;
    private String targetRole;
    private String entityType; // MANAGER_PROJECT | CLIENT_PROJECT | CLIENT_TICKET | TICKET
    private String entityName;
    private String searchQuery;
    private Double confidence;
    private String reason;
}
