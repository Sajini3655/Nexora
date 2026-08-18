package com.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
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

    @Column
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    @Builder.Default
    private Set<Role> additionalRoles = new LinkedHashSet<>();

    // Custom (admin-defined) roles assigned to this user, stored by name.
    // Built-in roles live in role/additionalRoles; these are the extra
    // named roles created in Access Control that grant module access.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_custom_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role_name", nullable = false)
    @Builder.Default
    private Set<String> customRoles = new LinkedHashSet<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (enabled == null) {
            enabled = false;
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        for (Role r : getAllRoles()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + r.name()));
        }
        if (customRoles != null) {
            for (String customRole : customRoles) {
                if (customRole != null && !customRole.isBlank()) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + customRole));
                }
            }
        }
        return authorities;
    }

    public Set<Role> getAllRoles() {
        Set<Role> all = new LinkedHashSet<>();
        if (role != null) {
            all.add(role);
        }
        if (additionalRoles != null) {
            all.addAll(additionalRoles);
        }
        return all;
    }

    // All assigned role names: built-in (enum) names plus custom role names.
    public Set<String> getAllRoleNames() {
        Set<String> names = new LinkedHashSet<>();
        for (Role r : getAllRoles()) {
            names.add(r.name());
        }
        if (customRoles != null) {
            for (String customRole : customRoles) {
                if (customRole != null && !customRole.isBlank()) {
                    names.add(customRole);
                }
            }
        }
        return names;
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
        return Boolean.TRUE.equals(enabled);
    }
}