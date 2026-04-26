package com.admin.config;

import com.admin.entity.RoleDefinition;
import com.admin.entity.RolePermission;
import com.admin.entity.User;
import com.admin.repository.RoleDefinitionRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DemoSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleDefinitionRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.enabled:true}")
    private boolean bootstrapAdminEnabled;

    @Value("${app.bootstrap-admin.email:admin@nexora.com}")
    private String adminEmail;

    @Value("${app.bootstrap-admin.name:Admin User}")
    private String adminName;

    @Value("${app.bootstrap-admin.password:admin123}")
    private String adminPassword;

    private static final String[] DEFAULT_ROLES = {"ADMIN", "MANAGER", "DEVELOPER", "CLIENT"};
    private static final String[] MODULES = {"DASHBOARD", "TASKS", "CHAT", "FILES", "REPORTS"};

    @Override
    @Transactional
    public void run(String... args) {
        try {
            System.out.println("🚀 Starting DemoSeeder...");
            seedRoles();
            
            if (!bootstrapAdminEnabled) {
                System.out.println("ℹ️ Bootstrap Admin is disabled.");
                return;
            }

            String normalizedEmail = adminEmail.trim().toLowerCase();
            System.out.println("🔍 Checking Admin user: " + normalizedEmail);

            Optional<User> existingAdmin = userRepository.findByEmailIgnoreCase(normalizedEmail);
            RoleDefinition adminRole = roleRepository.findByNameIgnoreCase("ADMIN")
                    .orElseThrow(() -> new RuntimeException("ADMIN role not found after seeding"));

            if (existingAdmin.isPresent()) {
                User admin = existingAdmin.get();
                if (admin.getRole() == null) {
                    admin.setRole(adminRole);
                    userRepository.save(admin);
                    System.out.println("✅ Updated existing ADMIN user with role: " + normalizedEmail);
                } else {
                    System.out.println("ℹ️ Admin user already exists with role: " + admin.getRole().getName());
                }
            } else {
                User admin = User.builder()
                        .email(normalizedEmail)
                        .name(adminName)
                        .role(adminRole)
                        .enabled(true)
                        .password(passwordEncoder.encode(adminPassword))
                        .build();

                userRepository.save(admin);
                System.out.println("✅ Bootstrapped ADMIN user: " + normalizedEmail);
            }

            // Bootstrap Manager
            seedUser("manager@nexora.com", "Manager User", "MANAGER", "manager123");
            // Bootstrap Developer
            seedUser("dev@nexora.com", "Developer User", "DEVELOPER", "dev123");
            // Bootstrap Client
            seedUser("client@nexora.com", "Client User", "CLIENT", "client123");
            
            System.out.println("✨ DemoSeeder completed successfully.");
        } catch (Exception e) {
            System.err.println("❌ DemoSeeder failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void seedUser(String email, String name, String roleName, String password) {
        String normalizedEmail = email.trim().toLowerCase();
        System.out.println("🔍 Seeding user: " + normalizedEmail + " (" + roleName + ")");
        
        Optional<User> existing = userRepository.findByEmailIgnoreCase(normalizedEmail);
        RoleDefinition role = roleRepository.findByNameIgnoreCase(roleName)
                .orElseThrow(() -> new RuntimeException(roleName + " role not found"));

        if (existing.isPresent()) {
            User user = existing.get();
            boolean changed = false;

            if (user.getRole() == null || !roleName.equalsIgnoreCase(user.getRole().getName())) {
                user.setRole(role);
                changed = true;
            }

            if (!Boolean.TRUE.equals(user.getEnabled())) {
                user.setEnabled(true);
                changed = true;
            }

            boolean passwordMissing = user.getPassword() == null || user.getPassword().isBlank();
            boolean passwordMismatch = !passwordMissing && !passwordEncoder.matches(password, user.getPassword());
            if (passwordMissing || passwordMismatch) {
                user.setPassword(passwordEncoder.encode(password));
                changed = true;
            }

            if (changed) {
                userRepository.save(user);
                System.out.println("✅ Synced demo user: " + normalizedEmail);
            }
            return;
        }

        User user = User.builder()
                .email(normalizedEmail)
                .name(name)
                .role(role)
                .enabled(true)
                .password(passwordEncoder.encode(password))
                .build();

        userRepository.save(user);
        System.out.println("✅ Seeded user: " + normalizedEmail);
    }

    private void seedRoles() {
        System.out.println("📁 Seeding roles...");
        for (String roleName : DEFAULT_ROLES) {
            if (!roleRepository.existsByNameIgnoreCase(roleName)) {
                System.out.println("➕ Creating role: " + roleName);
                RoleDefinition role = RoleDefinition.builder()
                        .name(roleName)
                        .systemRole(true)
                        .build();
                
                // Add default permissions
                for (String module : MODULES) {
                    boolean hasAccess = defaultAccess(roleName, module);

                    RolePermission permission = RolePermission.builder()
                            .role(role)
                            .moduleKey(module)
                            .canAccess(hasAccess)
                            .build();
                    role.getPermissions().add(permission);
                }
                
                roleRepository.save(role);
                System.out.println("✅ Seeded role: " + roleName);
            } else {
                System.out.println("ℹ️ Role already exists: " + roleName);
                syncExistingRolePermissions(roleName);
            }
        }
    }

    private void syncExistingRolePermissions(String roleName) {
        RoleDefinition role = roleRepository.findByNameIgnoreCase(roleName).orElse(null);
        if (role == null) return;

        Map<String, RolePermission> existingByModule = role.getPermissions().stream()
                .collect(Collectors.toMap(RolePermission::getModuleKey, Function.identity(), (a, b) -> a));

        // If this is an old seeded MANAGER role with every module enabled,
        // shift to secure defaults: only dashboard enabled until admin grants more.
        boolean resetManagerDefaults = "MANAGER".equalsIgnoreCase(roleName)
                && MODULES.length > 0
                && existingByModule.size() == MODULES.length
                && existingByModule.values().stream().allMatch(RolePermission::isCanAccess);

        boolean changed = false;
        for (String module : MODULES) {
            RolePermission permission = existingByModule.get(module);
            if (permission == null) {
                role.getPermissions().add(RolePermission.builder()
                        .role(role)
                        .moduleKey(module)
                        .canAccess(defaultAccess(roleName, module))
                        .build());
                changed = true;
                continue;
            }

            if (resetManagerDefaults) {
                boolean shouldAccess = defaultAccess(roleName, module);
                if (permission.isCanAccess() != shouldAccess) {
                    permission.setCanAccess(shouldAccess);
                    changed = true;
                }
            }
        }

        if (changed) {
            roleRepository.save(role);
            System.out.println("✅ Synced role permissions: " + roleName);
        }
    }

    private boolean defaultAccess(String roleName, String module) {
        if ("ADMIN".equalsIgnoreCase(roleName)) return true;
        if ("MANAGER".equalsIgnoreCase(roleName)) return "DASHBOARD".equals(module);
        if ("CLIENT".equalsIgnoreCase(roleName)) return module.equals("DASHBOARD") || module.equals("CHAT");
        return true;
    }
}