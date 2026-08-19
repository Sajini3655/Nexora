package com.admin.service;

import com.admin.entity.Role;
import com.admin.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CoreBackendServicesTest {

    @Test
    void jwtTokenContainsIdentityAndAllRoles() {
        JwtService jwtService = jwtService();
        User user = User.builder()
                .id(7L)
                .name("Developer")
                .email("developer@example.com")
                .role(Role.DEVELOPER)
                .additionalRoles(new java.util.LinkedHashSet<>(List.of(Role.CLIENT)))
                .enabled(true)
                .build();

        String token = jwtService.generateToken(user);

        assertEquals("developer@example.com", jwtService.extractUsername(token));
        assertEquals("ROLE_DEVELOPER", jwtService.extractRole(token));
        assertEquals(List.of("ROLE_DEVELOPER", "ROLE_CLIENT"), jwtService.extractRoles(token));
        assertTrue(jwtService.isTokenValid(token, user));
    }

    @Test
    void jwtRejectsMalformedToken() {
        JwtService jwtService = jwtService();

        assertEquals(null, jwtService.extractUsername("not-a-token"));
        assertEquals(List.of(), jwtService.extractRoles("not-a-token"));
    }

    @Test
    void skillExtractionFallsBackToKeywordWeightsWhenAiUnavailable() {
        AiSkillExtractionService service = new AiSkillExtractionService();

        AiSkillExtractionService.SkillExtractionResult result = service.extract(
                "React dashboard",
                "Build a Spring Boot API with PostgreSQL tests"
        );

        assertFalse(result.isUsedAi());
        assertNotNull(result.getSkills());
        assertTrue(result.getSkills().stream().map(AiSkillExtractionService.SkillWeight::getName)
                .anyMatch(name -> name.equals("React")));
        assertTrue(result.getSkills().stream().map(AiSkillExtractionService.SkillWeight::getName)
                .anyMatch(name -> name.equals("Spring Boot")));
    }

    @Test
    void skillExtractionUsesGeneralFallbackWhenNoKeywordsMatch() {
        AiSkillExtractionService service = new AiSkillExtractionService();

        AiSkillExtractionService.SkillExtractionResult result = service.extract("Routine work", "General update");

        assertFalse(result.isUsedAi());
        assertEquals(1, result.getSkills().size());
        assertEquals("General", result.getSkills().get(0).getName());
        assertEquals(1.0, result.getSkills().get(0).getWeight());
    }

    @Test
    void classifierReturnsUnknownWhenAiServiceUnavailable() {
        EmailIssueClassifierService service = new EmailIssueClassifierService();

        EmailIssueClassifierService.ClassificationResult result = service.classify(
                "Cannot access account",
                "The login endpoint is failing"
        );

        assertTrue(result.isUnknown());
        assertFalse(result.isIssue());
        assertTrue(result.getReason().startsWith("AI classifier unavailable:"));
    }

    private JwtService jwtService() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "jwtSecret", "a-secure-test-secret-that-is-at-least-32-bytes-long");
        ReflectionTestUtils.setField(service, "jwtExpirationMs", 86_400_000L);
        return service;
    }
}
