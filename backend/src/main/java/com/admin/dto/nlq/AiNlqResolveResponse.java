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
    private String action;
    private String destinationId;
    private String targetRole;
    private String entityType;
    private String entityName;
    private String searchQuery;
    private Double confidence;
    private String reason;
}

