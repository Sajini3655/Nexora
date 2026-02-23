package com.admin.repository;

import com.admin.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // -----------------------
    // Native query for filtering users with pagination
    // -----------------------
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

    // -----------------------
    // Count query for filtered users
    // -----------------------
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
