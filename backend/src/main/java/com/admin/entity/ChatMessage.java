package com.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private ChatSession session;

    @ManyToOne
    private User sender;

    private String senderName;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime createdAt;
}