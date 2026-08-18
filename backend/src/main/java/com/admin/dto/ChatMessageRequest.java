package com.admin.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessageRequest {
    private Long sessionId;
    private Long userId;
    private String content;
}