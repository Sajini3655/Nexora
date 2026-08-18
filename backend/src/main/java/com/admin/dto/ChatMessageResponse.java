package com.admin.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long sessionId;
    private Long senderId;
    private String senderName;
    private String content;
    private LocalDateTime createdAt;
}