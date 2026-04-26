package com.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = true)
    private RoleDefinition role;

    // Legacy schema compatibility: some databases still have a non-null "role" column.
    @Column(name = "role", nullable = true)
    private String legacyRole;

    private static final Set<String> KNOWN_LEGACY_ROLES = Set.of("ADMIN", "MANAGER", "DEVELOPER", "CLIENT");

    @Builder.Default
    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "createdBy")
    private List<TaskItem> createdTasks;

    @OneToMany(mappedBy = "assignedTo")
    private List<TaskItem> assignedTasks;

    @PrePersist
    protected void onCreate() {
        legacyRole = resolveLegacyRole(role, legacyRole);
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        legacyRole = resolveLegacyRole(role, legacyRole);
        updatedAt = LocalDateTime.now();
    }

    private String resolveLegacyRole(RoleDefinition role, String currentLegacyRole) {
        if (role != null && role.getName() != null) {
            String normalized = role.getName().trim().toUpperCase();
            if (KNOWN_LEGACY_ROLES.contains(normalized)) {
                return normalized;
            }
            return "CLIENT";
        }
        if (currentLegacyRole == null || currentLegacyRole.isBlank()) {
            return "CLIENT";
        }
        String normalized = currentLegacyRole.trim().toUpperCase();
        return KNOWN_LEGACY_ROLES.contains(normalized) ? normalized : "CLIENT";
    }

    // Spring Security methods

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String roleName = (role != null) ? role.getName() : "CLIENT";
        return List.of(new SimpleGrantedAuthority("ROLE_" + roleName.toUpperCase()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}