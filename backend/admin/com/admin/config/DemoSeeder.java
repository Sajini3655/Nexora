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

        // Create demo MANAGER user
        String managerEmail = "manager@nexora.com";
        if (!userRepository.existsByEmail(managerEmail)) {
            User manager = User.builder()
                    .email(managerEmail)
                    .name("Manager User")
                    .role(Role.MANAGER)
                    .enabled(true)
                    .password(passwordEncoder.encode("manager123"))
                    .build();
            userRepository.save(manager);
            System.out.println("✅ Bootstrapped MANAGER user: " + managerEmail);
        }

        // Create demo DEVELOPER user
        String developerEmail = "developer@nexora.com";
        if (!userRepository.existsByEmail(developerEmail)) {
            User developer = User.builder()
                    .email(developerEmail)
                    .name("Developer User")
                    .role(Role.DEVELOPER)
                    .enabled(true)
                    .password(passwordEncoder.encode("developer123"))
                    .build();
            userRepository.save(developer);
            System.out.println("✅ Bootstrapped DEVELOPER user: " + developerEmail);
        }

        // Create demo CLIENT user
        String clientEmail = "client@nexora.com";
        if (!userRepository.existsByEmail(clientEmail)) {
            User client = User.builder()
                    .email(clientEmail)
                    .name("Client User")
                    .role(Role.CLIENT)
                    .enabled(true)
                    .password(passwordEncoder.encode("client123"))
                    .build();
            userRepository.save(client);
            System.out.println("✅ Bootstrapped CLIENT user: " + clientEmail);
        }
    }
}