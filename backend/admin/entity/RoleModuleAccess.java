package com.admin.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "role_module_access",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_role_module", columnNames = {"role", "module"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleModuleAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "module")
    private AccessModule module;

    @Column(nullable = false)
    private Boolean allowed;
}
