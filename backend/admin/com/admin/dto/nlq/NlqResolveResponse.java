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
public class NlqResolveResponse {
    // NAVIGATE | SWITCH_ROLE | MESSAGE
    private String action;
    private String path;
    private String targetRole;
    private String message;
}
