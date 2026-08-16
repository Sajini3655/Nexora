package com.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponseDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("event_type")
    private String eventType;

    @JsonProperty("title")
    private String title;

    @JsonProperty("message")
    private String message;

    @JsonProperty("aggregate_type")
    private String aggregateType;

    @JsonProperty("aggregate_id")
    private Long aggregateId;

    @JsonProperty("metadata")
    @Builder.Default
    private Map<String, Object> metadata = Map.of();

    @JsonProperty("read")
    private Boolean read;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
