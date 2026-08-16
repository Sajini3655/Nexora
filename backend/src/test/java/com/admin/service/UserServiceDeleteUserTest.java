package com.admin.service;

import com.admin.entity.AccessModule;
import com.admin.entity.ChatMessage;
import com.admin.entity.ChatSession;
import com.admin.entity.DeveloperProfile;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.TaskItem;
import com.admin.entity.Ticket;
import com.admin.entity.User;
import com.admin.entity.UserModuleOverride;
import com.admin.repository.DeveloperProfileRepository;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.TimesheetEntryRepository;
import com.admin.repository.UserModuleOverrideRepository;
import com.admin.repository.UserRepository;
import com.admin.repository.ChatMessageRepository;
import com.admin.repository.ChatSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceDeleteUserTest {

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
    private ProjectRepository projectRepository;

    @Mock
    private LiveUpdatePublisher liveUpdatePublisher;

    @Mock
    private UserModuleOverrideRepository userModuleOverrideRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void deleteUserShouldRemoveAssociatedRecordsAndDeleteUser() {
        User target = User.builder()
                .id(99L)
                .email("target@example.com")
                .name("Target User")
                .role(Role.DEVELOPER)
                .enabled(true)
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.of(target));
        when(taskRepository.findByCreatedById(99L)).thenReturn(List.of(TaskItem.builder().id(1L).title("Task").build()));
        when(taskRepository.findByAssignedToId(99L)).thenReturn(List.of(TaskItem.builder().id(2L).title("Task 2").build()));
        when(taskStoryPointRepository.findByTaskIdIn(List.of(1L, 2L))).thenReturn(List.of());
        when(taskStoryPointRepository.findByCompletedById(99L)).thenReturn(List.of());
        when(ticketRepository.findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(99L, 99L))
                .thenReturn(List.of(Ticket.builder().id(10L).title("Ticket").build()));
        when(ticketRepository.findByManagerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(ticketRepository.findByClientId(99L)).thenReturn(List.of());
        when(ticketRepository.findByProjectManagerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(chatMessageRepository.findBySenderIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(chatSessionRepository.findByStartedByIdOrderByStartedAtDesc(99L)).thenReturn(List.of());
        when(timesheetEntryRepository.findByDeveloperIdOrderByWorkDateDesc(99L)).thenReturn(List.of());
        when(timesheetEntryRepository.findByReviewedByIdOrderByWorkDateDesc(99L)).thenReturn(List.of());
        when(projectRepository.findByManagerOrderByCreatedAtDesc(target)).thenReturn(List.of(
                Project.builder().id(30L).name("Project").manager(target).build()
        ));
        when(timesheetEntryRepository.findByProject_IdInOrderByWorkDateDesc(List.of(30L))).thenReturn(List.of());
        when(taskRepository.findByProject_Id(30L)).thenReturn(List.of());
        when(userModuleOverrideRepository.findByUser_Id(99L)).thenReturn(List.of(
                UserModuleOverride.builder().id(50L).user(target).module(AccessModule.DASHBOARD).allowed(true).build()
        ));
        when(developerProfileRepository.findByUser_Id(99L)).thenReturn(Optional.of(
                DeveloperProfile.builder().id(70L).user(target).build()
        ));

        userService.deleteUser(99L);

        verify(inviteTokenRepository).deleteByUser_Id(99L);
        verify(taskRepository).deleteAll(anyList());
        verify(ticketRepository).deleteAll(anyList());
        verify(projectRepository).deleteAll(anyList());
        verify(userModuleOverrideRepository).deleteAll(anyList());
        verify(developerProfileRepository).delete(any(DeveloperProfile.class));
        verify(userRepository).deleteById(99L);
    }

        @Test
        void deleteUserShouldClearClientProjectReferencesBeforeDeletingUser() {
                User target = User.builder()
                                .id(99L)
                                .email("target@example.com")
                                .name("Target User")
                                .role(Role.CLIENT)
                                .enabled(true)
                                .build();

                User manager = User.builder()
                                .id(8L)
                                .email("manager@example.com")
                                .name("Manager")
                                .role(Role.MANAGER)
                                .enabled(true)
                                .build();

                Project clientProject = Project.builder()
                                .id(42L)
                                .name("Client Project")
                                .manager(manager)
                                .client(target)
                                .build();

                when(userRepository.findById(99L)).thenReturn(Optional.of(target));
                when(taskRepository.findByCreatedById(99L)).thenReturn(List.of());
                when(taskRepository.findByAssignedToId(99L)).thenReturn(List.of());
                when(taskStoryPointRepository.findByCompletedById(99L)).thenReturn(List.of());
                when(ticketRepository.findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(99L, 99L)).thenReturn(List.of());
                when(ticketRepository.findByManagerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
                when(ticketRepository.findByClientId(99L)).thenReturn(List.of());
                when(ticketRepository.findByProjectManagerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
                when(chatMessageRepository.findBySenderIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
                when(chatSessionRepository.findByStartedByIdOrderByStartedAtDesc(99L)).thenReturn(List.of());
                when(timesheetEntryRepository.findByDeveloperIdOrderByWorkDateDesc(99L)).thenReturn(List.of());
                when(timesheetEntryRepository.findByReviewedByIdOrderByWorkDateDesc(99L)).thenReturn(List.of());
                when(projectRepository.findByManagerOrderByCreatedAtDesc(target)).thenReturn(List.of());
                when(projectRepository.findByClient_IdOrderByCreatedAtDesc(99L)).thenReturn(List.of(clientProject));
                when(userModuleOverrideRepository.findByUser_Id(99L)).thenReturn(List.of());
                when(developerProfileRepository.findByUser_Id(99L)).thenReturn(Optional.empty());

                userService.deleteUser(99L);

                verify(projectRepository).findByClient_IdOrderByCreatedAtDesc(99L);
                verify(projectRepository).save(clientProject);
                verify(userRepository).deleteById(99L);
        }

    @Test
    void deleteUserShouldDeleteSessionMessagesBeforeDeletingStartedSessions() {
        User target = User.builder()
                .id(99L)
                .email("target@example.com")
                .name("Target User")
                .role(Role.DEVELOPER)
                .enabled(true)
                .build();

        ChatSession startedSession = ChatSession.builder()
                .id(401L)
                .startedBy(target)
                .build();

        ChatMessage sessionMessage = ChatMessage.builder()
                .id(501L)
                .session(startedSession)
                .sender(User.builder().id(7L).email("other@example.com").name("Other").role(Role.CLIENT).enabled(true).build())
                .content("message")
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.of(target));
        when(taskRepository.findByCreatedById(99L)).thenReturn(List.of());
        when(taskRepository.findByAssignedToId(99L)).thenReturn(List.of());
        when(taskStoryPointRepository.findByCompletedById(99L)).thenReturn(List.of());
        when(ticketRepository.findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(99L, 99L)).thenReturn(List.of());
        when(ticketRepository.findByManagerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(ticketRepository.findByClientId(99L)).thenReturn(List.of());
        when(ticketRepository.findByProjectManagerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(chatMessageRepository.findBySenderIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(chatSessionRepository.findByStartedByIdOrderByStartedAtDesc(99L)).thenReturn(List.of(startedSession));
        when(chatMessageRepository.findBySession_IdIn(List.of(401L))).thenReturn(List.of(sessionMessage));
        when(timesheetEntryRepository.findByDeveloperIdOrderByWorkDateDesc(99L)).thenReturn(List.of());
        when(timesheetEntryRepository.findByReviewedByIdOrderByWorkDateDesc(99L)).thenReturn(List.of());
        when(projectRepository.findByManagerOrderByCreatedAtDesc(target)).thenReturn(List.of());
        when(projectRepository.findByClient_IdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(userModuleOverrideRepository.findByUser_Id(99L)).thenReturn(List.of());
        when(developerProfileRepository.findByUser_Id(99L)).thenReturn(Optional.empty());

        userService.deleteUser(99L);

        verify(chatMessageRepository).deleteAll(anyList());
        verify(chatSessionRepository).deleteAll(List.of(startedSession));
        verify(userRepository).deleteById(99L);
    }

    @Test
    void deleteUserShouldDeleteManagedProjectSessionMessagesBeforeDeletingProject() {
        User target = User.builder()
                .id(99L)
                .email("target@example.com")
                .name("Target User")
                .role(Role.MANAGER)
                .enabled(true)
                .build();

        User otherStarter = User.builder()
                .id(22L)
                .email("otherstarter@example.com")
                .name("Other Starter")
                .role(Role.DEVELOPER)
                .enabled(true)
                .build();

        Project managedProject = Project.builder()
                .id(30L)
                .name("Managed Project")
                .manager(target)
                .build();

        ChatSession projectSession = ChatSession.builder()
                .id(601L)
                .project(managedProject)
                .startedBy(otherStarter)
                .build();

        ChatMessage projectSessionMessage = ChatMessage.builder()
                .id(701L)
                .session(projectSession)
                .sender(otherStarter)
                .content("project message")
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.of(target));
        when(taskRepository.findByCreatedById(99L)).thenReturn(List.of());
        when(taskRepository.findByAssignedToId(99L)).thenReturn(List.of());
        when(taskStoryPointRepository.findByCompletedById(99L)).thenReturn(List.of());
        when(ticketRepository.findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(99L, 99L)).thenReturn(List.of());
        when(ticketRepository.findByManagerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(ticketRepository.findByClientId(99L)).thenReturn(List.of());
        when(ticketRepository.findByProjectManagerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(chatMessageRepository.findBySenderIdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(chatSessionRepository.findByStartedByIdOrderByStartedAtDesc(99L)).thenReturn(List.of());
        when(timesheetEntryRepository.findByDeveloperIdOrderByWorkDateDesc(99L)).thenReturn(List.of());
        when(timesheetEntryRepository.findByReviewedByIdOrderByWorkDateDesc(99L)).thenReturn(List.of());
        when(projectRepository.findByManagerOrderByCreatedAtDesc(target)).thenReturn(List.of(managedProject));
        when(timesheetEntryRepository.findByProject_IdInOrderByWorkDateDesc(List.of(30L))).thenReturn(List.of());
        when(chatSessionRepository.findByProject_IdOrderByStartedAtDesc(30L)).thenReturn(List.of(projectSession));
        when(chatMessageRepository.findBySession_IdIn(List.of(601L))).thenReturn(List.of(projectSessionMessage));
        when(taskRepository.findByProject_Id(30L)).thenReturn(List.of());
        when(projectRepository.findByClient_IdOrderByCreatedAtDesc(99L)).thenReturn(List.of());
        when(userModuleOverrideRepository.findByUser_Id(99L)).thenReturn(List.of());
        when(developerProfileRepository.findByUser_Id(99L)).thenReturn(Optional.empty());

        userService.deleteUser(99L);

        verify(chatMessageRepository).deleteAll(anyList());
        verify(chatSessionRepository).deleteAll(List.of(projectSession));
        verify(projectRepository).deleteAll(List.of(managedProject));
        verify(userRepository).deleteById(99L);
    }
}
