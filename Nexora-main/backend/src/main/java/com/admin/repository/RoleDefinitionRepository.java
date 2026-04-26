package com.admin.repository;

import com.admin.entity.RoleDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleDefinitionRepository extends JpaRepository<RoleDefinition, Long> {
    Optional<RoleDefinition> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
