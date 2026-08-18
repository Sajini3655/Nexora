package com.admin.service;

import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.repository.ChatMessageRepository;
import com.admin.repository.ChatSessionRepository;
import com.admin.repository.DeveloperProfileRepository;
import com.admin.repository.DeveloperSkillRepository;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.TimesheetEntryRepository;
import com.admin.repository.UserModuleOverrideRepository;
import com.admin.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceDeleteTest {

    @Mock
    private InviteTokenRepository inviteTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MailService mailService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskStoryPointRepository taskStoryPointRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private TimesheetEntryRepository timesheetEntryRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private DeveloperProfileRepository developerProfileRepository;

    @Mock
    private DeveloperSkillRepository developerSkillRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserModuleOverrideRepository userModuleOverrideRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private LiveUpdatePublisher liveUpdatePublisher;

    @InjectMocks
    private UserService userService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deleteUser_shouldDeleteUserRoleJoinRowsBeforeRemovingUserRecord() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@example.com", "pw")
        );

        User targetUser = User.builder()
                .id(42L)
                .name("Target User")
                .email("target@example.com")
                .role(Role.CLIENT)
                .enabled(true)
                .build();

        when(userRepository.findById(42L)).thenReturn(Optional.of(targetUser));
        when(taskRepository.findByCreatedById(42L)).thenReturn(List.of());
        when(taskRepository.findByAssignedToId(42L)).thenReturn(List.of());
        when(ticketRepository.findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(42L, 42L)).thenReturn(List.of());
        when(ticketRepository.findByManagerIdOrderByCreatedAtDesc(42L)).thenReturn(List.of());
        when(ticketRepository.findByClientId(42L)).thenReturn(List.of());
        when(ticketRepository.findByProjectManagerIdOrderByCreatedAtDesc(42L)).thenReturn(List.of());
        when(chatMessageRepository.findBySenderIdOrderByCreatedAtDesc(42L)).thenReturn(List.of());
        when(chatSessionRepository.findByStartedByIdOrderByStartedAtDesc(42L)).thenReturn(List.of());
        when(projectRepository.findByManagerOrderByCreatedAtDesc(targetUser)).thenReturn(List.of());
        when(projectRepository.findByClient_IdOrderByCreatedAtDesc(42L)).thenReturn(List.of());
        when(timesheetEntryRepository.findByDeveloperIdOrderByWorkDateDesc(42L)).thenReturn(List.of());
        when(timesheetEntryRepository.findByReviewedByIdOrderByWorkDateDesc(42L)).thenReturn(List.of());
        when(taskStoryPointRepository.findByCompletedById(42L)).thenReturn(List.of());
        when(developerProfileRepository.findByUser_Id(42L)).thenReturn(Optional.empty());
        when(userModuleOverrideRepository.findByUser_Id(42L)).thenReturn(List.of());
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of());
        when(jdbcTemplate.update(anyString(), anyLong())).thenReturn(0);

        String message = userService.deleteUser(42L);

        assertEquals("User account permanently deleted successfully.", message);
        verify(jdbcTemplate).update("DELETE FROM user_roles WHERE user_id = ?", 42L);
        verify(userRepository).deleteById(42L);
    }
}
