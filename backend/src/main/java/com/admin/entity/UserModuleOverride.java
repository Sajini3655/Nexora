package com.admin.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "user_module_override",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_module", columnNames = {"user_id", "module"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserModuleOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "module")
    private AccessModule module;

    @Column(nullable = false)
    private Boolean allowed;
}
