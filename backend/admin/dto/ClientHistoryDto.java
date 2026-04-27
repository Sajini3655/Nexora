package com.admin.dto;

import java.time.LocalDateTime;

import com.admin.entity.ClientHistory;

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
public class ClientHistoryDto {
    private Long id;
    private String itemName;
    private String description;
    private String category;
    private ClientHistory.HistoryType type;
    private LocalDateTime completedDate;
    private LocalDateTime createdAt;

    public static ClientHistoryDto fromEntity(ClientHistory entity) {
        return ClientHistoryDto.builder()
                .id(entity.getId())
                .itemName(entity.getItemName())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .type(entity.getType())
                .completedDate(entity.getCompletedDate())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
