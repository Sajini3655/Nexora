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
public class AiNlqDestination {
    private String id;
    private String label;
    private String path;
    private List<String> keywords;
}
