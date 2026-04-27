package com.admin.service;

import com.admin.dto.DeveloperProfileDto;
import com.admin.dto.SkillDto;
import com.admin.entity.*;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.DeveloperProfileRepository;
import com.admin.repository.DeveloperSkillRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeveloperProfileService {

    private final UserRepository userRepository;
    private final DeveloperProfileRepository profileRepository;
    private final DeveloperSkillRepository skillRepository;

    @Transactional
    public DeveloperProfileDto getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        DeveloperProfile profile = profileRepository.findByUserId(user.getId())
                .orElseGet(() -> profileRepository.save(DeveloperProfile.builder()
                        .user(user)
                        .experienceLevel(ExperienceLevel.JUNIOR)
                        .capacityPoints(20)
                        .build()));

        List<DeveloperSkill> skills = skillRepository.findByProfileId(profile.getId());

        return toDto(user, profile, skills);
    }

    @Transactional
    public DeveloperProfileDto updateMyProfile(String email, DeveloperProfileDto req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        DeveloperProfile profile = profileRepository.findByUserId(user.getId())
                .orElseGet(() -> profileRepository.save(DeveloperProfile.builder()
                        .user(user)
                        .experienceLevel(ExperienceLevel.JUNIOR)
                        .capacityPoints(20)
                        .build()));

        // update user name (email stays the login identifier in demo)
        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName().trim());
        }

        // optional: allow updating email in UI, but keep unique constraint safe
        // For demo: ignore email update.

        profile.setPhone(req.getPhone());
        profile.setLocation(req.getLocation());
        profile.setBio(req.getBio());

        if (req.getExperienceLevel() != null) profile.setExperienceLevel(req.getExperienceLevel());
        if (req.getCapacityPoints() != null && req.getCapacityPoints() > 0) {
            profile.setCapacityPoints(req.getCapacityPoints());
        }

        // Replace skills
        skillRepository.deleteByProfileId(profile.getId());
        if (req.getSkills() != null) {
            for (SkillDto s : req.getSkills()) {
                if (s.getName() == null || s.getName().isBlank()) continue;
                int lvl = (s.getLevel() == null) ? 3 : s.getLevel();
                if (lvl < 1) lvl = 1;
                if (lvl > 5) lvl = 5;
                skillRepository.save(DeveloperSkill.builder()
                        .profile(profile)
                        .name(s.getName().trim())
                        .level(lvl)
                        .build());
            }
        }

        userRepository.save(user);
        profileRepository.save(profile);

        List<DeveloperSkill> skills = skillRepository.findByProfileId(profile.getId());
        return toDto(user, profile, skills);
    }

    private DeveloperProfileDto toDto(User user, DeveloperProfile profile, List<DeveloperSkill> skills) {
        List<SkillDto> skillDtos = skills.stream()
                .sorted(Comparator.comparing(DeveloperSkill::getName, String.CASE_INSENSITIVE_ORDER))
                .map(s -> SkillDto.builder().name(s.getName()).level(s.getLevel()).build())
                .collect(Collectors.toList());

        return DeveloperProfileDto.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(profile.getPhone())
                .location(profile.getLocation())
                .bio(profile.getBio())
                .experienceLevel(profile.getExperienceLevel())
                .capacityPoints(profile.getCapacityPoints())
                .skills(skillDtos)
                .build();
    }
}
