package com.admin.repository;

import com.admin.entity.AccessModule;
import com.admin.entity.RoleModuleAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RoleModuleAccessRepository extends JpaRepository<RoleModuleAccess, Long> {

    List<RoleModuleAccess> findByRoleIn(List<String> roles);

    Optional<RoleModuleAccess> findByRoleAndModule(String role, AccessModule module);

    @Query("SELECT DISTINCT r.role FROM RoleModuleAccess r")
    List<String> findDistinctRoles();

    void deleteByRole(String role);
}
