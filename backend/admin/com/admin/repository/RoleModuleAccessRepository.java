package com.admin.repository;

import com.admin.entity.AccessModule;
import com.admin.entity.RoleModuleAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoleModuleAccessRepository extends JpaRepository<RoleModuleAccess, Long> {

    List<RoleModuleAccess> findByRoleIn(List<String> roles);

    Optional<RoleModuleAccess> findByRoleAndModule(String role, AccessModule module);

    @Query("SELECT r FROM RoleModuleAccess r WHERE lower(trim(r.role)) = lower(trim(:role)) AND r.module = :module")
    Optional<RoleModuleAccess> findByNormalizedRoleAndModule(@Param("role") String role, @Param("module") AccessModule module);

    @Query("SELECT DISTINCT r.role FROM RoleModuleAccess r")
    List<String> findDistinctRoles();

    void deleteByRole(String role);
}
