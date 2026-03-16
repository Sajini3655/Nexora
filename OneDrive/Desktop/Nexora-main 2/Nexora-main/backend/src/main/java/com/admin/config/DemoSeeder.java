package com.admin.config;

import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DemoSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.enabled:true}")
    private boolean bootstrapAdminEnabled;

    @Value("${app.bootstrap-admin.email:admin@nexora.com}")
    private String adminEmail;

    @Value("${app.bootstrap-admin.name:Admin User}")
    private String adminName;

    @Value("${app.bootstrap-admin.password:admin123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (!bootstrapAdminEnabled) {
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            return;
        }

        User admin = User.builder()
                .email(normalizedEmail)
                .name(adminName)
                .role(Role.ADMIN)
                .enabled(true)
                .password(passwordEncoder.encode(adminPassword))
                .build();

        userRepository.save(admin);
        System.out.println("✅ Bootstrapped ADMIN user: " + normalizedEmail);
    }
}