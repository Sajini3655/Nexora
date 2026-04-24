package com.admin.repository;

import com.admin.entity.AccessModule;
import com.admin.entity.Role;
import com.admin.entity.RoleModuleAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleModuleAccessRepository extends JpaRepository<RoleModuleAccess, Long> {

    List<RoleModuleAccess> findByRoleIn(List<Role> roles);

    Optional<RoleModuleAccess> findByRoleAndModule(Role role, AccessModule module);
}
