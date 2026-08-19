package com.admin.service;

import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private InviteTokenRepository inviteTokenRepository;

    @InjectMocks
    private AdminDashboardService dashboardService;

    @Test
    void statsAggregatesUserRoleAndInviteCounts() {
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);
        when(userRepository.countByRole(Role.MANAGER)).thenReturn(2L);
        when(userRepository.countByRole(Role.DEVELOPER)).thenReturn(4L);
        when(userRepository.countByRole(Role.CLIENT)).thenReturn(3L);
        when(userRepository.countByEnabled(true)).thenReturn(8L);
        when(userRepository.countByEnabled(false)).thenReturn(2L);
        when(userRepository.countByCreatedAtBetween(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(2L, 5L);
        when(inviteTokenRepository.countByUsedFalse()).thenReturn(3L);

        var stats = dashboardService.getStats();

        assertEquals(10L, stats.getTotalUsers());
        assertEquals(1L, stats.getAdmins());
        assertEquals(2L, stats.getManagers());
        assertEquals(4L, stats.getDevelopers());
        assertEquals(3L, stats.getClients());
        assertEquals(8L, stats.getEnabledUsers());
        assertEquals(2L, stats.getDisabledUsers());
        assertEquals(2L, stats.getNewUsersToday());
        assertEquals(5L, stats.getNewUsersThisWeek());
        assertEquals(3L, stats.getPendingInvites());
    }

    @Test
    void recentUsersMapsRepositoryUsers() {
        User user = User.builder().id(7L).name("Manager").email("manager@example.com")
                .role(Role.MANAGER).enabled(true).build();
        when(userRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of(user));

        var recent = dashboardService.getRecentUsers();

        assertEquals(1, recent.size());
        assertEquals(7L, recent.get(0).getId());
        assertEquals("manager@example.com", recent.get(0).getEmail());
        assertEquals(Role.MANAGER, recent.get(0).getRole());
    }
}
