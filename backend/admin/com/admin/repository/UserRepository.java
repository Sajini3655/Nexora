package com.admin.repository;

import com.admin.entity.Role;
import com.admin.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(Role role);

    List<User> findByRoleAndEnabled(Role role, Boolean enabled);

    List<User> findByRoleOrderByNameAsc(Role role);

    long countByEnabled(Boolean enabled);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<User> findTop5ByOrderByCreatedAtDesc();

    @Query(
        value = """
            SELECT TO_CHAR(u.created_at, 'Dy') AS day, COUNT(*) AS total
            FROM users u
            WHERE u.created_at >= :startDate
            GROUP BY EXTRACT(DOW FROM u.created_at), TO_CHAR(u.created_at, 'Dy')
            ORDER BY EXTRACT(DOW FROM u.created_at)
        """,
        nativeQuery = true
    )
    List<Object[]> countRegistrationsGroupedByDay(@Param("startDate") LocalDateTime startDate);

    @Query("""
        select distinct u
        from User u
        left join u.additionalRoles additionalRole
        where (
            :q = ''
            or lower(u.name) like concat('%', :q, '%')
            or lower(u.email) like concat('%', :q, '%')
        )
        and (
            :role is null
            or u.role = :role
            or additionalRole = :role
        )
        and (:enabled is null or u.enabled = :enabled)
        order by u.createdAt desc
    """)
    Page<User> findByFilters(
            @Param("q") String q,
            @Param("role") Role role,
            @Param("enabled") Boolean enabled,
            Pageable pageable
    );

    @Query("""
        select count(distinct u)
        from User u
        left join u.additionalRoles additionalRole
        where (
            :q = ''
            or lower(u.name) like concat('%', :q, '%')
            or lower(u.email) like concat('%', :q, '%')
        )
        and (
            :role is null
            or u.role = :role
            or additionalRole = :role
        )
        and (:enabled is null or u.enabled = :enabled)
    """)
    long countByFilters(
            @Param("q") String q,
            @Param("role") Role role,
            @Param("enabled") Boolean enabled
    );
}
