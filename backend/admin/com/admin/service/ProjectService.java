package com.admin.service;

import com.admin.dto.CreateProjectRequest;
import com.admin.dto.CreateTaskStoryPointRequest;
import com.admin.dto.ProjectResponse;
import com.admin.dto.ProjectTaskRequest;
import com.admin.dto.ProjectTaskResponse;
import com.admin.dto.UpdateProjectRequest;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.StoryPointStatus;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskStoryPoint;
import com.admin.entity.TaskStatus;
import com.admin.entity.Ticket;
import com.admin.entity.TimesheetEntry;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.ChatSessionRepository;
import com.admin.repository.ChatMessageRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.TimesheetEntryRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskStoryPointRepository taskStoryPointRepository;
    private final TaskRepository taskRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final TicketRepository ticketRepository;
    private final TimesheetEntryRepository timesheetEntryRepository;
    private final LiveUpdatePublisher liveUpdatePublisher;
    private final ProjectFileService projectFileService;

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, Authentication authentication) {
        User manager = getAuthenticatedManager(authentication);

        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription().trim())
                .manager(manager)
                .build();

        if (request.getClientId() != null) {
            User client = userRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Selected client not found"));

            if (!client.getAllRoles().contains(Role.CLIENT)) {
                throw new AccessDeniedException("Selected user is not a client");
            }

            project.setClient(client);
        }

        List<TaskItem> taskItems = request.getTasks().stream()
                .map(taskRequest -> {
                    TaskItem task = TaskItem.builder()
                            .title(taskRequest.getTitle().trim())
                            .description(taskRequest.getDescription())
                            .priority(taskRequest.getPriority())
                            .status(TaskStatus.TODO)
                            .createdBy(manager)
                            .assignedTo(null)
                            .project(project)
                            .build();
                    
                    if (taskRequest.getDueDate() != null && !taskRequest.getDueDate().isEmpty()) {
                        try {
                            task.setDueDate(LocalDate.parse(taskRequest.getDueDate()));
                        } catch (Exception e) {
                        }
                    }
                    
                    return task;
                })
                .toList();

        project.getTasks().addAll(taskItems);
        Project savedProject = projectRepository.save(project);

        createNestedStoryPoints(request.getTasks(), savedProject.getTasks());

        liveUpdatePublisher.publishProjectsChanged("created");
        liveUpdatePublisher.publishTasksChanged("created");
        return mapToResponse(savedProject);
    }

    @Transactional
    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request, Authentication authentication) {
        User manager = getAuthenticatedManager(authentication);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (project.getManager() == null || !project.getManager().getId().equals(manager.getId())) {
            throw new AccessDeniedException("You can only update your own projects");
        }

        project.setName(request.getName().trim());
        project.setDescription(request.getDescription().trim());

        if (request.getClientId() != null) {
            User client = userRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Selected client not found"));

            if (!client.getAllRoles().contains(Role.CLIENT)) {
                throw new AccessDeniedException("Selected user is not a client");
            }

            project.setClient(client);
        } else {
            project.setClient(null);
        }

        Project saved = projectRepository.save(project);
        liveUpdatePublisher.publishProjectsChanged("updated");
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects(Authentication authentication) {
        User manager = getAuthenticatedManager(authentication);

        return projectRepository.findByManagerOrderByCreatedAtDesc(manager)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId, Authentication authentication) {
        User manager = getAuthenticatedManager(authentication);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (project.getManager() == null || !project.getManager().getId().equals(manager.getId())) {
            throw new AccessDeniedException("You can only view your own projects");
        }

        return mapToResponse(project);
    }

    @Transactional
    public String deleteProject(Long projectId, Authentication authentication) {
        log.info("DELETE PROJECT request received: projectId={}", projectId);
        
        User manager = getAuthenticatedManager(authentication);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (project.getManager() == null || !project.getManager().getId().equals(manager.getId())) {
            throw new AccessDeniedException("You can only delete your own projects");
        }

        log.info("DELETE PROJECT cleanup started: projectId={}, projectName={}", projectId, project.getName());

        try {
            // Get project tasks first
            List<TaskItem> projectTasks = taskRepository.findByProject_Id(projectId);
            List<Long> taskIds = projectTasks.stream()
                    .map(TaskItem::getId)
                    .toList();
            
            log.info("DELETE PROJECT Step 1: Found {} tasks to clean up", taskIds.size());

            // STEP 1: Delete chat messages for project chat sessions
            try {
                log.info("DELETE PROJECT Step 1: Deleting chat messages");
                List<Long> chatSessionIds = chatSessionRepository.findByProject_IdOrderByStartedAtDesc(projectId)
                        .stream()
                        .map(session -> session.getId())
                        .toList();
                
                if (!chatSessionIds.isEmpty()) {
                    chatMessageRepository.deleteAll(chatMessageRepository.findBySession_IdIn(chatSessionIds));
                }
                log.debug("DELETE PROJECT Step 1 completed: Deleted messages for {} chat sessions", chatSessionIds.size());
            } catch (Exception e) {
                log.error("DELETE PROJECT FAILED AT STEP 1: Error deleting chat messages: {}", e.getMessage(), e);
                throw e;
            }

            // STEP 2: Delete chat sessions
            try {
                log.info("DELETE PROJECT Step 2: Deleting chat sessions");
                chatSessionRepository.deleteAll(chatSessionRepository.findByProject_IdOrderByStartedAtDesc(projectId));
                log.debug("DELETE PROJECT Step 2 completed");
            } catch (Exception e) {
                log.error("DELETE PROJECT FAILED AT STEP 2: Error deleting chat sessions: {}", e.getMessage(), e);
                throw e;
            }

            // STEP 3: Delete timesheet entries for the project (both task-based and project-based)
            try {
                log.info("DELETE PROJECT Step 3: Deleting timesheet entries");
                List<TimesheetEntry> timesheetEntries = timesheetEntryRepository.findAll().stream()
                    .filter(entry -> {
                        // Delete if project matches OR task is in this project
                        if (entry.getProject() != null && entry.getProject().getId().equals(projectId)) {
                            return true;
                        }
                        if (entry.getTask() != null && entry.getTask().getId() != null && taskIds.contains(entry.getTask().getId())) {
                            return true;
                        }
                        return false;
                    })
                    .toList();
                
                if (!timesheetEntries.isEmpty()) {
                    timesheetEntryRepository.deleteAll(timesheetEntries);
                    log.debug("DELETE PROJECT Step 3: Deleted {} timesheet entries", timesheetEntries.size());
                }
                log.debug("DELETE PROJECT Step 3 completed");
            } catch (Exception e) {
                log.error("DELETE PROJECT FAILED AT STEP 3: Error deleting timesheet entries: {}", e.getMessage(), e);
                throw e;
            }

            // STEP 4: Delete task story points
            try {
                log.info("DELETE PROJECT Step 4: Deleting task story points");
                if (!taskIds.isEmpty()) {
                    List<TaskStoryPoint> storyPoints = taskStoryPointRepository.findAll().stream()
                        .filter(sp -> sp.getTask() != null && sp.getTask().getId() != null && taskIds.contains(sp.getTask().getId()))
                        .toList();
                    
                    if (!storyPoints.isEmpty()) {
                        taskStoryPointRepository.deleteAll(storyPoints);
                        log.debug("DELETE PROJECT Step 4: Deleted {} story points", storyPoints.size());
                    }
                }
                log.debug("DELETE PROJECT Step 4 completed");
            } catch (Exception e) {
                log.error("DELETE PROJECT FAILED AT STEP 4: Error deleting task story points: {}", e.getMessage(), e);
                throw e;
            }

            // STEP 5: Delete tickets for project
            try {
                log.info("DELETE PROJECT Step 5: Deleting tickets");
                List<Ticket> projectTickets = ticketRepository.findAll().stream()
                    .filter(ticket -> ticket.getProject() != null && ticket.getProject().getId().equals(projectId))
                    .toList();
                
                if (!projectTickets.isEmpty()) {
                    ticketRepository.deleteAll(projectTickets);
                    log.debug("DELETE PROJECT Step 5: Deleted {} tickets", projectTickets.size());
                }
                log.debug("DELETE PROJECT Step 5 completed");
            } catch (Exception e) {
                log.error("DELETE PROJECT FAILED AT STEP 5: Error deleting tickets: {}", e.getMessage(), e);
                throw e;
            }

            // STEP 6: Delete tasks
            try {
                log.info("DELETE PROJECT Step 6: Deleting tasks");
                if (!projectTasks.isEmpty()) {
                    taskRepository.deleteAll(projectTasks);
                    taskRepository.flush();
                    log.debug("DELETE PROJECT Step 6: Deleted {} tasks", projectTasks.size());
                }
                log.debug("DELETE PROJECT Step 6 completed");
            } catch (Exception e) {
                log.error("DELETE PROJECT FAILED AT STEP 6: Error deleting tasks: {}", e.getMessage(), e);
                throw e;
            }

            // STEP 7: Delete project files
            try {
                log.info("DELETE PROJECT Step 7: Deleting project files");
                projectFileService.deleteAllProjectFiles(projectId);
                log.debug("DELETE PROJECT Step 7 completed");
            } catch (Exception e) {
                log.error("DELETE PROJECT FAILED AT STEP 7: Error deleting project files: {}", e.getMessage(), e);
                throw e;
            }

            // STEP 8: Delete project itself
            try {
                log.info("DELETE PROJECT Step 8: Deleting project");
                projectRepository.deleteById(projectId);
                projectRepository.flush();
                log.debug("DELETE PROJECT Step 8 completed");
            } catch (Exception e) {
                log.error("DELETE PROJECT FAILED AT STEP 8: Error deleting project: {}", e.getMessage(), e);
                throw e;
            }

            log.info("DELETE PROJECT deleted successfully: projectId={}", projectId);
            liveUpdatePublisher.publishProjectsChanged("deleted");
            return "Project deleted successfully.";

        } catch (Exception e) {
            log.error("DELETE PROJECT FAILED: {}", e.getMessage(), e);
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    private User getAuthenticatedManager(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (!user.getAllRoles().contains(Role.MANAGER)) {
            throw new AccessDeniedException("Only managers can perform this action");
        }

        return user;
    }

    private void createNestedStoryPoints(List<ProjectTaskRequest> taskRequests, List<TaskItem> savedTasks) {
        for (int i = 0; i < taskRequests.size(); i++) {
            ProjectTaskRequest taskRequest = taskRequests.get(i);
            TaskItem task = savedTasks.get(i);

            if (taskRequest.getStoryPoints() != null && !taskRequest.getStoryPoints().isEmpty()) {
                List<TaskStoryPoint> storyPoints = taskRequest.getStoryPoints().stream()
                        .map(spRequest -> TaskStoryPoint.builder()
                                .task(task)
                                .title(spRequest.getTitle().trim())
                                .description(spRequest.getDescription())
                                .pointValue(spRequest.getPointValue())
                                .status(StoryPointStatus.TODO)
                                .completed(Boolean.FALSE)
                                .completedAt(null)
                                .completedBy(null)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build())
                        .toList();

                taskStoryPointRepository.saveAll(storyPoints);
            }
        }
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .managerId(project.getManager() == null ? null : project.getManager().getId())
                .managerName(project.getManager() == null ? null : project.getManager().getName())
            .clientId(project.getClient() == null ? null : project.getClient().getId())
            .clientName(project.getClient() == null ? null : project.getClient().getName())
            .clientEmail(project.getClient() == null ? null : project.getClient().getEmail())
                .createdAt(project.getCreatedAt())
                .tasks(project.getTasks().stream()
                        .map(task -> ProjectTaskResponse.builder()
                                .id(task.getId())
                                .title(task.getTitle())
                                .priority(task.getPriority())
                                .status(task.getStatus())
                        .estimatedPoints(task.getEstimatedPoints())
                                .build())
                        .toList())
                .build();
    }
}

