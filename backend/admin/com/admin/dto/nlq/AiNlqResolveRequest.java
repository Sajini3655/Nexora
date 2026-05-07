package com.admin.dto.nlq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiNlqResolveRequest {
    private String query;
    private String currentRole;
    private List<AiNlqDestination> allowedDestinations;
}
