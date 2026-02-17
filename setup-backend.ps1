# PowerShell Script to Setup Spring Boot Backend
# Run this script in PowerShell: .\setup-backend.ps1

$baseDir = "backend"

Write-Host "Creating Spring Boot Backend Project Structure..." -ForegroundColor Green

# Create base directory
New-Item -ItemType Directory -Path $baseDir -Force | Out-Null

# Create main source directories
$dirs = @(
    "$baseDir\src\main\java\com\admin",
    "$baseDir\src\main\java\com\admin\config",
    "$baseDir\src\main\java\com\admin\controller",
    "$baseDir\src\main\java\com\admin\dto",
    "$baseDir\src\main\java\com\admin\entity",
    "$baseDir\src\main\java\com\admin\exception",
    "$baseDir\src\main\java\com\admin\repository",
    "$baseDir\src\main\java\com\admin\service",
    "$baseDir\src\main\resources",
    "$baseDir\src\test\java\com\admin"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

Write-Host "Directory structure created!" -ForegroundColor Cyan

# Create pom.xml
$pomXml = @'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.admin</groupId>
    <artifactId>admin-backend</artifactId>
    <version>1.0.0</version>
    <name>Admin Backend</name>
    <description>Admin Dashboard Backend with Spring Boot</description>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
'@

Set-Content -Path "$baseDir\pom.xml" -Value $pomXml

# Create application.properties
$appProps = @'
# Server Configuration
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/admindb
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT Configuration
jwt.secret=your-secret-key-change-this-in-production-make-it-at-least-256-bits
jwt.expiration=86400000

# Logging
logging.level.org.springframework.security=DEBUG
logging.level.com.admin=DEBUG
'@

Set-Content -Path "$baseDir\src\main\resources\application.properties" -Value $appProps

# Create AdminApplication.java
$mainApp = @'
package com.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AdminApplication {
    public static void main(String[] args) {
        SpringApplication.run(AdminApplication.class, args);
    }
}
'@

Set-Content -Path "$baseDir\src\main\java\com\admin\AdminApplication.java" -Value $mainApp

# Create Role.java
$roleEnum = @'
package com.admin.entity;

public enum Role {
    ADMIN,
    MANAGER,
    DEVELOPER,
    CLIENT
}
'@

Set-Content -Path "$baseDir\src\main\java\com\admin\entity\Role.java" -Value $roleEnum

# Create User.java
$userEntity = @'
package com.admin.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    @Column(nullable = false)
    private Boolean enabled = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    
    @Override
    public String getUsername() {
        return email;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
'@

Set-Content -Path "$baseDir\src\main\java\com\admin\entity\User.java" -Value $userEntity

# Create Ticket.java
$ticketEntity = @'
package com.admin.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String status = "OPEN";
    
    private String priority = "MEDIUM";
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
'@

Set-Content -Path "$baseDir\src\main\java\com\admin\entity\Ticket.java" -Value $ticketEntity

# Create UserRepository.java
$userRepo = @'
package com.admin.repository;

import com.admin.entity.Role;
import com.admin.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE " +
           "(:q IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:enabled IS NULL OR u.enabled = :enabled)")
    Page<User> findByFilters(
        @Param("q") String q,
        @Param("role") Role role,
        @Param("enabled") Boolean enabled,
        Pageable pageable
    );
}
'@

Set-Content -Path "$baseDir\src\main\java\com\admin\repository\UserRepository.java" -Value $userRepo

# Create TicketRepository.java
$ticketRepo = @'
package com.admin.repository;

import com.admin.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
}
'@

Set-Content -Path "$baseDir\src\main\java\com\admin\repository\TicketRepository.java" -Value $ticketRepo

Write-Host "`nCreating remaining files..." -ForegroundColor Cyan
Write-Host "Please copy the remaining Java files from the artifact into their respective folders:" -ForegroundColor Yellow
Write-Host "  - config/ (SecurityConfig, JwtAuthenticationFilter, CorsConfig)" -ForegroundColor White
Write-Host "  - service/ (JwtService, AuthService, UserService, TicketService)" -ForegroundColor White
Write-Host "  - controller/ (AuthController, AdminUserController, TicketController)" -ForegroundColor White
Write-Host "  - dto/ (All DTO classes)" -ForegroundColor White
Write-Host "  - exception/ (GlobalExceptionHandler, ResourceNotFoundException)" -ForegroundColor White

Write-Host "`n✅ Backend project structure created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Copy remaining Java files from the artifact" -ForegroundColor White
Write-Host "2. Update application.properties with your PostgreSQL credentials" -ForegroundColor White
Write-Host "3. Create database: CREATE DATABASE admindb;" -ForegroundColor White
Write-Host "4. Run: mvn spring-boot:run" -ForegroundColor White

# Ask if user wants to open in VS Code
$openVSCode = Read-Host "`nDo you want to open the project in VS Code now? (Y/N)"
if ($openVSCode -eq 'Y' -or $openVSCode -eq 'y') {
    Set-Location $baseDir
    code .
    Write-Host "`nOpening VS Code..." -ForegroundColor Green
}

Write-Host "`nDone! 🚀" -ForegroundColor Green
'@

Set-Content -Path "setup-backend.ps1" -Value $content
