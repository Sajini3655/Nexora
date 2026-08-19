package com.admin.service;

import com.admin.dto.nlq.NlqResolveRequest;
import com.admin.dto.nlq.NlqResolveResponse;
import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NlqNavigationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccessControlService accessControlService;

    @Mock
    private ProjectService projectService;

    @Mock
    private ClientPortalService clientPortalService;

    @Mock
    private TicketService ticketService;

    @Mock
    private TaskAssignmentService taskAssignmentService;

    @Mock
    private DeveloperTaskService developerTaskService;

    @InjectMocks
    private NlqNavigationService navigationService;

    @Test
    void emptyQuery_returnsMessage() {
        NlqResolveResponse response = navigationService.resolve(
                mock(Authentication.class),
                NlqResolveRequest.builder().query("   ").currentRole("MANAGER").build()
        );

        assertEquals("MESSAGE", response.getAction());
        assertEquals("Type a page name, like 'dashboard' or 'projects'.", response.getMessage());
    }

    @Test
    void managerDashboard_navigatesToManagerHome() {
        givenManagerWithAccess(true, true);

        NlqResolveResponse response = navigationService.resolve(
                managerAuthentication(),
                NlqResolveRequest.builder().query("dashboard").currentRole("MANAGER").build()
        );

        assertEquals("NAVIGATE", response.getAction());
        assertEquals("/manager", response.getPath());
    }

    @Test
    void managerProjects_navigatesToProjectManagement() {
        givenManagerWithAccess(true, true);

        NlqResolveResponse response = navigationService.resolve(
                managerAuthentication(),
                NlqResolveRequest.builder().query("projects").currentRole("MANAGER").build()
        );

        assertEquals("NAVIGATE", response.getAction());
        assertEquals("/manager/project-management", response.getPath());
    }

    @Test
    void managerProjectsWithoutFilesAccess_returnsMessage() {
        givenManagerWithAccess(true, false);

        NlqResolveResponse response = navigationService.resolve(
                managerAuthentication(),
                NlqResolveRequest.builder().query("projects").currentRole("MANAGER").build()
        );

        assertEquals("MESSAGE", response.getAction());
        assertEquals("I couldn't map that to a page in this workspace.", response.getMessage());
    }

    private Authentication managerAuthentication() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("manager@example.com");
        return authentication;
    }

    private void givenManagerWithAccess(boolean dashboardAccess, boolean filesAccess) {
        User manager = User.builder()
                .id(7L)
                .name("Manager")
                .email("manager@example.com")
                .role(Role.MANAGER)
                .enabled(true)
                .build();

        Map<String, Boolean> access = new LinkedHashMap<>();
        access.put("DASHBOARD", dashboardAccess);
        access.put("FILES", filesAccess);

        when(userRepository.findByEmailIgnoreCase("manager@example.com"))
                .thenReturn(Optional.of(manager));
        when(accessControlService.getEffectiveAccessForUser("manager@example.com"))
                .thenReturn(access);
    }
}
