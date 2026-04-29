package com.admin.config;

import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserRepository userRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers("/api/auth/accept-invite").permitAll()
                .requestMatchers("/api/inbound/emails/tickets").permitAll()
                .requestMatchers("/h2/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/api/chat/**").permitAll()
                .requestMatchers("/api/timesheets/admin", "/api/timesheets/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/timesheets/team", "/api/timesheets/team/**").hasRole("MANAGER")
                .requestMatchers("/api/timesheets/my", "/api/timesheets/my/**").hasRole("DEVELOPER")
                .requestMatchers("/api/timesheets/options").hasRole("DEVELOPER")
                .requestMatchers("/api/timesheets").hasRole("DEVELOPER")
                .requestMatchers("/api/timesheets/*/submit").hasRole("DEVELOPER")
                .requestMatchers("/api/timesheets/*/approve", "/api/timesheets/*/reject").hasRole("MANAGER")
                .requestMatchers("/api/timesheets/*").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/manager/**").hasRole("MANAGER")
                .requestMatchers("/api/developer/**").hasRole("DEVELOPER")
                .requestMatchers("/api/client/**").hasRole("CLIENT")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            String normalizedEmail = username == null ? "" : username.trim().toLowerCase();

            UserDetails user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + normalizedEmail));

            return user;
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}