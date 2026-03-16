package com.admin.repository;

import com.admin.entity.Role;
import com.admin.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(Role role);

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

    @Query(
        value = """
            SELECT * FROM users u
            WHERE (:q IS NULL OR LOWER(u.name) LIKE CONCAT('%', LOWER(:q), '%')
               OR LOWER(u.email) LIKE CONCAT('%', LOWER(:q), '%'))
              AND (:role IS NULL OR u.role = :role)
              AND (:enabled IS NULL OR u.enabled = :enabled)
            ORDER BY u.created_at DESC
            LIMIT :size OFFSET :offset
        """,
        nativeQuery = true
    )
    List<User> findByFiltersNative(
            @Param("q") String q,
            @Param("role") String role,
            @Param("enabled") Boolean enabled,
            @Param("size") int size,
            @Param("offset") int offset
    );

    @Query(
        value = """
            SELECT COUNT(*) FROM users u
            WHERE (:q IS NULL OR LOWER(u.name) LIKE CONCAT('%', LOWER(:q), '%')
               OR LOWER(u.email) LIKE CONCAT('%', LOWER(:q), '%'))
              AND (:role IS NULL OR u.role = :role)
              AND (:enabled IS NULL OR u.enabled = :enabled)
        """,
        nativeQuery = true
    )
    long countByFilters(
            @Param("q") String q,
            @Param("role") String role,
            @Param("enabled") Boolean enabled
    );
}