package com.admin.service;

import com.admin.dto.CreateProjectRequest;
import com.admin.dto.CreateTaskStoryPointRequest;
import com.admin.dto.NotificationEventDto;
import com.admin.dto.ProjectResponse;
import com.admin.dto.ProjectTaskRequest;
import com.admin.dto.ProjectTaskResponse;
import com.admin.dto.UpdateProjectRequest;
import com.admin.entity.ActivityType;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.StoryPointStatus;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskStoryPoint;
import com.admin.entity.TaskStatus;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskStoryPointRepository taskStoryPointRepository;
    private final LiveUpdatePublisher liveUpdatePublisher;
    private final NotificationPublisher notificationPublisher;
    private final ProjectActivityService projectActivityService;

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, Authentication authentication) {
        User manager = getAuthenticatedManager(authentication);

        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription().trim())
                .manager(manager)
                .build();

        User client = null;
        if (request.getClientId() != null) {
            client = userRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Selected client not found"));

            if (!client.getAllRoles().contains(Role.CLIENT)) {
                throw new AccessDeniedException("Selected user is not a client");
            }

            if (!Boolean.TRUE.equals(client.getEnabled())) {
                throw new RuntimeException("Cannot assign project to a disabled user.");
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

        // Record activity
        projectActivityService.recordActivity(
                savedProject,
                manager,
                ActivityType.PROJECT_CREATED,
                "Project created",
                "Project '" + savedProject.getName() + "' was created"
        );

        // If client was assigned, record that activity too
        if (client != null) {
            projectActivityService.recordActivity(
                    savedProject,
                    manager,
                    ActivityType.CLIENT_ASSIGNED,
                    "Client assigned",
                    "Client " + client.getEmail() + " was assigned to this project"
            );
        }

        liveUpdatePublisher.publishProjectsChanged("created");
        liveUpdatePublisher.publishTasksChanged("created");

        // Publish notification if project was assigned to a client
        if (client != null) {
            NotificationEventDto notification = NotificationEventDto.builder()
                    .eventType("PROJECT_ASSIGNED")
                    .sourceUserId(manager.getId())
                    .targetUserId(client.getId())
                    .aggregateType("PROJECT")
                    .aggregateId(savedProject.getId())
                    .title("New Project Assigned")
                    .message("You have been assigned a new project: " + savedProject.getName())
                    .metadata(Map.of(
                        "projectId", savedProject.getId(),
                        "projectName", savedProject.getName(),
                        "managerId", manager.getId(),
                        "managerName", manager.getName() != null ? manager.getName() : manager.getEmail()
                    ))
                    .build();
            notificationPublisher.publish(notification);
        }

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

        // Track if client assignment changed for notifications
        User oldClient = project.getClient();

        project.setName(request.getName().trim());
        project.setDescription(request.getDescription().trim());

        User newClient = null;
        if (request.getClientId() != null) {
            newClient = userRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Selected client not found"));

            if (!newClient.getAllRoles().contains(Role.CLIENT)) {
                throw new AccessDeniedException("Selected user is not a client");
            }

            if (!Boolean.TRUE.equals(newClient.getEnabled())) {
                throw new RuntimeException("Cannot assign project to a disabled user.");
            }

            project.setClient(newClient);
        } else {
            project.setClient(null);
        }

        Project saved = projectRepository.save(project);
        
        // Record activity for project update if details changed
        String oldNameDesc = "";
        String newNameDesc = "";
        if (!project.getName().equals(request.getName().trim()) || 
            !project.getDescription().equals(request.getDescription().trim())) {
            projectActivityService.recordActivity(
                    saved,
                    manager,
                    ActivityType.PROJECT_UPDATED,
                    "Project updated",
                    "Project details were updated"
            );
        }
        
        // Record activity if client assignment changed
        if ((oldClient == null && newClient != null) || 
            (oldClient != null && newClient == null) ||
            (oldClient != null && newClient != null && !oldClient.getId().equals(newClient.getId()))) {
            if (newClient != null) {
                projectActivityService.recordActivity(
                        saved,
                        manager,
                        ActivityType.CLIENT_ASSIGNED,
                        "Client assigned",
                        "Client " + newClient.getEmail() + " was assigned to this project"
                );
            } else {
                projectActivityService.recordActivity(
                        saved,
                        manager,
                        ActivityType.CLIENT_ASSIGNED,
                        "Client removed",
                        "Client assignment was removed from this project"
                );
            }
        }

        liveUpdatePublisher.publishProjectsChanged("updated");

        // Publish notification if client assignment changed
        if (newClient != null && (oldClient == null || !oldClient.getId().equals(newClient.getId()))) {
            NotificationEventDto notification = NotificationEventDto.builder()
                    .eventType("PROJECT_ASSIGNED")
                    .sourceUserId(manager.getId())
                    .targetUserId(newClient.getId())
                    .aggregateType("PROJECT")
                    .aggregateId(saved.getId())
                    .title("Project Assigned to You")
                    .message("You have been assigned a project: " + saved.getName())
                    .metadata(Map.of(
                        "projectId", saved.getId(),
                        "projectName", saved.getName(),
                        "managerId", manager.getId(),
                        "managerName", manager.getName() != null ? manager.getName() : manager.getEmail()
                    ))
                    .build();
            notificationPublisher.publish(notification);
        }

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

