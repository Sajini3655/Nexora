package com.admin.repository;

import com.admin.entity.DeveloperSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeveloperSkillRepository extends JpaRepository<DeveloperSkill, Long> {
    List<DeveloperSkill> findByProfileId(Long profileId);
    void deleteByProfileId(Long profileId);
}
