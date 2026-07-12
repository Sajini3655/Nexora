package com.admin.service;

import com.admin.repository.RoleModuleAccessRepository;
import com.admin.repository.UserModuleOverrideRepository;
import com.admin.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessControlServiceTest {

    @Mock
    private RoleModuleAccessRepository roleModuleAccessRepository;

    @Mock
    private UserModuleOverrideRepository userModuleOverrideRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AccessControlService accessControlService;

    @Test
    void getRoleMatrixShouldReturnDefaultMatrixWhenRepositoryQueryFails() {
        when(roleModuleAccessRepository.findDistinctRoles()).thenReturn(List.of());
        when(roleModuleAccessRepository.findByRoleIn(anyList())).thenThrow(new IllegalArgumentException("Unknown enum value"));

        Map<String, Map<String, Boolean>> matrix = assertDoesNotThrow(accessControlService::getRoleMatrix);

        assertTrue(matrix.containsKey("MANAGER"));
        assertTrue(matrix.containsKey("DEVELOPER"));
        assertTrue(matrix.containsKey("CLIENT"));
        assertTrue(matrix.get("MANAGER").get("DASHBOARD"));
    }

    @Test
    void saveRoleMatrixShouldNotThrowWhenRepositoryCannotReadModuleEnum() {
        when(roleModuleAccessRepository.findByRoleAndModule(anyString(), any())).thenThrow(new IllegalArgumentException("Unknown enum value"));
        when(roleModuleAccessRepository.findDistinctRoles()).thenReturn(List.of());

        Map<String, Map<String, Boolean>> result = assertDoesNotThrow(() -> accessControlService.saveRoleMatrix(
                Map.of("MANAGER", Map.<String, Object>of("DASHBOARD", true))
        ));

        assertTrue(result.containsKey("MANAGER"));
        assertTrue(result.get("MANAGER").get("DASHBOARD"));
    }

    @Test
    void saveRoleMatrixShouldNotThrowWhenCleanupQueryFails() {
        when(roleModuleAccessRepository.findByRoleAndModule(anyString(), any())).thenReturn(java.util.Optional.empty());
        when(roleModuleAccessRepository.findDistinctRoles()).thenThrow(new IllegalArgumentException("Unknown enum value"));

        Map<String, Map<String, Boolean>> result = assertDoesNotThrow(() -> accessControlService.saveRoleMatrix(
                Map.of("MANAGER", Map.<String, Object>of("DASHBOARD", true))
        ));

        assertTrue(result.containsKey("MANAGER"));
    }
}
