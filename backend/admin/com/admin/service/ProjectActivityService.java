package com.admin.service;

import com.admin.dto.ProjectActivityResponseDto;
import com.admin.entity.ActivityType;
import com.admin.entity.Project;
import com.admin.entity.ProjectActivity;
import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectActivityRepository;
import com.admin.repository.ProjectRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectActivityService {

    private final ProjectActivityRepository projectActivityRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recordActivity(Project project, User performedBy, ActivityType activityType,
                              String title, String description) {
        ProjectActivity activity = ProjectActivity.builder()
                .project(project)
                .performedBy(performedBy)
                .activityType(activityType)
                .title(title)
                .description(description)
                .build();
        projectActivityRepository.save(activity);
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityResponseDto> getClientActivities(Authentication authentication) {
        User client = getAuthenticatedClient(authentication);
        List<ProjectActivity> activities = projectActivityRepository
                .findActivitiesByClientIdOrderByCreatedAtDesc(client.getId());
        return activities.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityResponseDto> getProjectActivitiesByClient(Long projectId, Authentication authentication) {
        User client = getAuthenticatedClient(authentication);
        
        // Verify that the project belongs to this client
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        if (project.getClient() == null || !project.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You can only view history for your own projects");
        }
        
        List<ProjectActivity> activities = projectActivityRepository
                .findActivitiesByProjectIdAndClientIdOrderByCreatedAtDesc(projectId, client.getId());
        return activities.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityResponseDto> getRecentClientActivities(Authentication authentication, int limit) {
        User client = getAuthenticatedClient(authentication);
        List<ProjectActivity> activities = projectActivityRepository
                .findRecentActivitiesByClientId(client.getId(), limit);
        return activities.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    private User getAuthenticatedClient(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }

        User client = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (!client.getAllRoles().contains(Role.CLIENT)) {
            throw new AccessDeniedException("Only clients can access this endpoint");
        }

        return client;
    }

    private ProjectActivityResponseDto toResponseDto(ProjectActivity activity) {
        return ProjectActivityResponseDto.builder()
                .id(activity.getId())
                .projectId(activity.getProject().getId())
                .projectName(activity.getProject().getName())
                .activityType(activity.getActivityType())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .performedBy(activity.getPerformedBy() != null
                        ? (activity.getPerformedBy().getName() != null
                        ? activity.getPerformedBy().getName()
                        : activity.getPerformedBy().getEmail())
                        : "System")
                .createdAt(activity.getCreatedAt())
                .build();
    }
}
