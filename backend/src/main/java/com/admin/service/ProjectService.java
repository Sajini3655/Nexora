package com.admin.service;

import com.admin.dto.CreateProjectRequest;
import com.admin.dto.ProjectResponse;
import com.admin.dto.ProjectTaskResponse;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.TaskItem;
import com.admin.entity.TaskStatus;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
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
                .map(task -> TaskItem.builder()
                        .title(task.getTitle().trim())
                        .priority(task.getPriority())
                        .status(TaskStatus.TODO)
                        .createdBy(manager)
                        .assignedTo(null)
                        .project(project)
                        .build())
                .toList();

        project.getTasks().addAll(taskItems);

        Project savedProject = projectRepository.save(project);
                liveUpdatePublisher.publishProjectsChanged("created");
                liveUpdatePublisher.publishTasksChanged("created");
                return mapToResponse(savedProject);
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
