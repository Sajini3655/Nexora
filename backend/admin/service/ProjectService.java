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

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskStoryPointRepository taskStoryPointRepository;
    private final LiveUpdatePublisher liveUpdatePublisher;

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, Authentication authentication) {
        User manager = getAuthenticatedManager(authentication);

        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription().trim())
                .manager(manager)
                .build();

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
                    
                    // Set due date if provided
                    if (taskRequest.getDueDate() != null && !taskRequest.getDueDate().isEmpty()) {
                        try {
                            task.setDueDate(LocalDate.parse(taskRequest.getDueDate()));
                        } catch (Exception e) {
                            // Invalid date format, skip setting dueDate
                        }
                    }
                    
                    return task;
                })
                .toList();

        project.getTasks().addAll(taskItems);
        Project savedProject = projectRepository.save(project);

        // Create nested story points for each task
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
                .createdAt(project.getCreatedAt())
                .tasks(project.getTasks().stream()
                        .map(task -> ProjectTaskResponse.builder()
                                .id(task.getId())
                                .title(task.getTitle())
                                .priority(task.getPriority())
                                .status(task.getStatus())
                                .build())
                        .toList())
                .build();
    }
}
