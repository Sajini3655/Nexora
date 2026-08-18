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
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Project project;

    @ManyToOne
    private User startedBy;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Builder.Default
    private Boolean ended = false;
}