package com.admin.config;

import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.entity.DeveloperProfile;
import com.admin.entity.DeveloperSkill;
import com.admin.entity.ExperienceLevel;
import com.admin.repository.DeveloperProfileRepository;
import com.admin.repository.DeveloperSkillRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates demo users if they don't exist.
 * This makes the project runnable on a fresh H2 DB without doing invite flow.
 */
@Component
@RequiredArgsConstructor
public class DemoSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DeveloperProfileRepository profileRepository;
    private final DeveloperSkillRepository skillRepository;

    @Override
    public void run(String... args) {
        seedUser("admin@nexora.com", "Admin User", Role.ADMIN, "admin123");
        seedUser("manager@nexora.com", "Manager User", Role.MANAGER, "manager123");
        User dev = seedUser("dev@nexora.com", "Developer User", Role.DEVELOPER, "dev123");

        // Seed a developer profile + skills (so the AI assignment demo works out of the box)
        if (dev != null) {
            seedDeveloperProfile(dev);
        }
    }

    private User seedUser(String email, String name, Role role, String rawPassword) {
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            return userRepository.findByEmail(normalizedEmail).orElse(null);
        }

        User user = User.builder()
                .email(normalizedEmail)
                .name(name)
                .role(role)
                .enabled(true)
                .password(passwordEncoder.encode(rawPassword))
                .build();

        userRepository.save(user);
        System.out.println("✅ Seeded " + role + " user: " + normalizedEmail);
        return user;
    }

    private void seedDeveloperProfile(User dev) {
        DeveloperProfile profile = profileRepository.findByUserId(dev.getId()).orElse(null);
        if (profile == null) {
            profile = profileRepository.save(DeveloperProfile.builder()
                    .user(dev)
                    .experienceLevel(ExperienceLevel.MID)
                    .capacityPoints(20)
                    .phone("")
                    .location("")
                    .bio("")
                    .build());
        }

        // Seed skills only if none exist
        if (skillRepository.findByProfileId(profile.getId()).isEmpty()) {
            skillRepository.save(DeveloperSkill.builder().profile(profile).name("React").level(4).build());
            skillRepository.save(DeveloperSkill.builder().profile(profile).name("Node.js").level(4).build());
            skillRepository.save(DeveloperSkill.builder().profile(profile).name("Database").level(3).build());
        }
    }
}
