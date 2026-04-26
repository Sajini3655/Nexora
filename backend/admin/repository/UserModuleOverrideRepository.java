package com.admin.repository;

import com.admin.entity.AccessModule;
import com.admin.entity.UserModuleOverride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserModuleOverrideRepository extends JpaRepository<UserModuleOverride, Long> {

    List<UserModuleOverride> findByUser_Id(Long userId);

    Optional<UserModuleOverride> findByUser_IdAndModule(Long userId, AccessModule module);

    void deleteByUser_IdAndModule(Long userId, AccessModule module);
}
