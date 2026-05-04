package com.admin.service;

import com.admin.dto.*;
import com.admin.entity.*;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TaskRepository;
import com.admin.repository.TaskStoryPointRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TaskStoryPointService {

    private static final List<TaskStatus> COMPLETED_TASK_STATUSES = List.of(TaskStatus.DONE, TaskStatus.COMPLETED);

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TaskStoryPointRepository storyPointRepository;
    private final ProjectRepository projectRepository;
    private final LiveUpdatePublisher liveUpdatePublisher;

    @Transactional
    public TaskStoryPointDto createStoryPoint(String actorEmail, Long taskId, CreateTaskStoryPointRequest request) {
        User actor = getUserByEmail(actorEmail);
        TaskItem task = getTask(taskId);
        validateCanCreateStoryPoint(actor, task, request.getPointValue());

        // Ensure task has estimatedPoints set and positive
        Integer taskEstimated = task.getEstimatedPoints();
        if (taskEstimated == null || taskEstimated <= 0) {
            throw new RuntimeException("Task must have estimated points set before creating story points");
        }

        // Ensure total point values do not exceed task.estimatedPoints
        List<TaskStoryPoint> existing = storyPointRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        long existingTotal = existing.stream().mapToLong(p -> p.getPointValue() == null ? 0 : p.getPointValue()).sum();
        if (existingTotal + (request.getPointValue() == null ? 0 : request.getPointValue()) > taskEstimated) {
            throw new RuntimeException("Adding this story point would exceed the task's estimated points");
        }

        TaskStoryPoint storyPoint = TaskStoryPoint.builder()
                .task(task)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .pointValue(request.getPointValue())
                .status(StoryPointStatus.TODO)
                .completed(Boolean.FALSE)
                .completedAt(null)
                .completedBy(null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        TaskStoryPoint saved = storyPointRepository.save(storyPoint);
        updateTaskStatusBasedOnProgress(task);
        liveUpdatePublisher.publishTasksChanged("updated");
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskStoryPointDto> getStoryPointsByTask(String actorEmail, Long taskId) {
        User actor = getUserByEmail(actorEmail);
        TaskItem task = getTask(taskId);

        validateCanViewTask(actor, task);

        return storyPointRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public TaskStoryPointDto updateStoryPoint(String actorEmail, Long storyPointId, UpdateTaskStoryPointRequest request) {
        User actor = getUserByEmail(actorEmail);
        TaskStoryPoint storyPoint = getStoryPoint(storyPointId);

        validateManagerCanManageStoryPoints(actor, storyPoint.getTask());

        // When updating a story point, ensure the total does not exceed task.estimatedPoints
        TaskItem task = storyPoint.getTask();
        Integer taskEstimated = task.getEstimatedPoints();
        if (taskEstimated == null || taskEstimated <= 0) {
            throw new RuntimeException("Task must have estimated points set before updating story points");
        }

        List<TaskStoryPoint> existing = storyPointRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        long othersTotal = existing.stream()
                .filter(p -> !Objects.equals(p.getId(), storyPoint.getId()))
                .mapToLong(p -> p.getPointValue() == null ? 0 : p.getPointValue())
                .sum();

        if (othersTotal + (request.getPointValue() == null ? 0 : request.getPointValue()) > taskEstimated) {
            throw new RuntimeException("Updating this story point would exceed the task's estimated points");
        }

        storyPoint.setTitle(request.getTitle().trim());
        storyPoint.setDescription(request.getDescription());
        storyPoint.setPointValue(request.getPointValue());

        TaskStoryPoint saved = storyPointRepository.save(storyPoint);
        updateTaskStatusBasedOnProgress(storyPoint.getTask());
        liveUpdatePublisher.publishTasksChanged("updated");
        return toDto(saved);
    }

    @Transactional
    public void deleteStoryPoint(String actorEmail, Long storyPointId) {
        User actor = getUserByEmail(actorEmail);
        TaskStoryPoint storyPoint = getStoryPoint(storyPointId);

        validateManagerCanManageStoryPoints(actor, storyPoint.getTask());

        TaskItem task = storyPoint.getTask();
        storyPointRepository.delete(storyPoint);
        updateTaskStatusBasedOnProgress(task);
        liveUpdatePublisher.publishTasksChanged("updated");
    }

    @Transactional
    public TaskStoryPointDto markStoryPointDone(String developerEmail, Long storyPointId) {
        User developer = getUserByEmail(developerEmail);
        TaskStoryPoint storyPoint = getStoryPoint(storyPointId);

        validateAssignedDeveloperCanToggle(developer, storyPoint.getTask());

        storyPoint.setStatus(StoryPointStatus.DONE);
        storyPoint.setCompleted(Boolean.TRUE);
        storyPoint.setCompletedAt(LocalDateTime.now());
        storyPoint.setCompletedBy(developer);

        TaskStoryPoint saved = storyPointRepository.save(storyPoint);
        updateTaskStatusBasedOnProgress(storyPoint.getTask());
        liveUpdatePublisher.publishTasksChanged("updated");
        return toDto(saved);
    }

    @Transactional
    public TaskStoryPointDto markStoryPointTodo(String developerEmail, Long storyPointId) {
        User developer = getUserByEmail(developerEmail);
        TaskStoryPoint storyPoint = getStoryPoint(storyPointId);

        validateAssignedDeveloperCanToggle(developer, storyPoint.getTask());

        storyPoint.setStatus(StoryPointStatus.TODO);
        storyPoint.setCompleted(Boolean.FALSE);
        storyPoint.setCompletedAt(null);
        storyPoint.setCompletedBy(null);

        TaskStoryPoint saved = storyPointRepository.save(storyPoint);
        updateTaskStatusBasedOnProgress(storyPoint.getTask());
        liveUpdatePublisher.publishTasksChanged("updated");
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public TaskProgressResponse calculateTaskProgress(String actorEmail, Long taskId) {
        User actor = getUserByEmail(actorEmail);
        TaskItem task = getTask(taskId);

        validateCanViewTask(actor, task);

        return buildTaskProgress(task);
    }

    @Transactional(readOnly = true)
    public DeveloperProgressResponse calculateDeveloperProgress(String actorEmail, Long developerId) {
        User actor = getUserByEmail(actorEmail);
        User developer = userRepository.findById(Objects.requireNonNull(developerId))
                .orElseThrow(() -> new ResourceNotFoundException("Developer not found"));

        if (!developer.getAllRoles().contains(Role.DEVELOPER)) {
            throw new ResourceNotFoundException("Developer not found");
        }

        boolean actorIsAdmin = actor.getAllRoles().contains(Role.ADMIN);
        boolean actorIsManager = actor.getAllRoles().contains(Role.MANAGER);
        boolean actorIsSameDeveloper = actor.getAllRoles().contains(Role.DEVELOPER) && Objects.equals(actor.getId(), developer.getId());

        if (!actorIsAdmin && !actorIsManager && !actorIsSameDeveloper) {
            throw new AccessDeniedException("You are not allowed to view this developer progress");
        }

        List<TaskItem> developerTasks = taskRepository.findByAssignedToId(developer.getId());
        long assignedTasks = developerTasks.size();
        long completedTasks = developerTasks.stream().filter(this::isTaskCompleted).count();
        long inProgressTasks = developerTasks.stream().filter(task -> task.getStatus() == TaskStatus.IN_PROGRESS).count();

        long totalStoryPoints = storyPointRepository.countByTaskAssignedToId(developer.getId());
        long completedStoryPoints = storyPointRepository.countByTaskAssignedToIdAndStatus(developer.getId(), StoryPointStatus.DONE);
        ProgressTotals totals = calculateAggregateTotals(developerTasks);

        int averageProgress = calculatePercentage(totals.completedPointValue, totals.totalPointValue);

        return DeveloperProgressResponse.builder()
                .developerId(developer.getId())
                .developerName(developer.getName())
                .assignedTasks(assignedTasks)
                .completedTasks(completedTasks)
                .inProgressTasks(inProgressTasks)
                .totalStoryPoints(totalStoryPoints)
                .completedStoryPoints(completedStoryPoints)
                .totalPointValue(totals.totalPointValue)
                .completedPointValue(totals.completedPointValue)
                .averageProgress(averageProgress)
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectProgressResponse calculateProjectProgress(String actorEmail, Long projectId) {
        User actor = getUserByEmail(actorEmail);
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateCanViewProject(actor, project);

        long totalTasks = taskRepository.countByProject_Id(project.getId());
        long completedTasks = taskRepository.countByProject_IdAndStatusIn(project.getId(), COMPLETED_TASK_STATUSES);

        List<TaskItem> projectTasks = taskRepository.findByProject_Id(project.getId());
        ProgressTotals totals = calculateAggregateTotals(projectTasks);
        int progress = calculatePercentage(totals.completedPointValue, totals.totalPointValue);

        return ProjectProgressResponse.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .totalStoryPoints(totals.totalStoryPoints)
                .completedStoryPoints(totals.completedStoryPoints)
                .totalPointValue(totals.totalPointValue)
                .completedPointValue(totals.completedPointValue)
                .progressPercentage(progress)
                .build();
    }

    @Transactional
    public void updateTaskStatusBasedOnProgress(Long taskId) {
        TaskItem task = getTask(taskId);
        updateTaskStatusBasedOnProgress(task);
    }

    @Transactional
    protected void updateTaskStatusBasedOnProgress(TaskItem task) {
        ProgressTotals totals = calculateTaskTotals(task);
        int progress = calculatePercentage(totals.completedPointValue, totals.totalPointValue);

        TaskStatus nextStatus;
        if (progress == 0) {
            nextStatus = TaskStatus.TODO;
        } else if (progress == 100) {
            nextStatus = TaskStatus.DONE;
        } else {
            nextStatus = TaskStatus.IN_PROGRESS;
        }

        if (task.getStatus() != nextStatus) {
            task.setStatus(nextStatus);
            taskRepository.save(task);
        }
    }

    private TaskProgressResponse buildTaskProgress(TaskItem task) {
        ProgressTotals totals = calculateTaskTotals(task);
        int progress = calculatePercentage(totals.completedPointValue, totals.totalPointValue);

        TaskStatus status;
        if (progress == 0) {
            status = TaskStatus.TODO;
        } else if (progress == 100) {
            status = TaskStatus.DONE;
        } else {
            status = TaskStatus.IN_PROGRESS;
        }

        return TaskProgressResponse.builder()
                .taskId(task.getId())
                .totalStoryPoints(totals.totalStoryPoints)
                .completedStoryPoints(totals.completedStoryPoints)
                .totalPointValue(totals.totalPointValue)
                .completedPointValue(totals.completedPointValue)
                .progressPercentage(progress)
                .status(status)
                .build();
    }

    private int calculatePercentage(long completedPointValue, long totalPointValue) {
        if (totalPointValue <= 0) {
            return 0;
        }
        return (int) Math.round((completedPointValue * 100.0) / totalPointValue);
    }

    private ProgressTotals calculateTaskTotals(TaskItem task) {
        List<TaskStoryPoint> storyPoints = storyPointRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        return calculateStoryPointTotals(storyPoints);
    }

    private ProgressTotals calculateAggregateTotals(List<TaskItem> tasks) {
        long totalStoryPoints = 0;
        long completedStoryPoints = 0;
        long totalPointValue = 0;
        long completedPointValue = 0;

        for (TaskItem task : tasks) {
            ProgressTotals totals = calculateTaskTotals(task);
            totalStoryPoints += totals.totalStoryPoints;
            completedStoryPoints += totals.completedStoryPoints;
            totalPointValue += totals.totalPointValue;
            completedPointValue += totals.completedPointValue;
        }

        return new ProgressTotals(totalStoryPoints, completedStoryPoints, totalPointValue, completedPointValue);
    }

    private ProgressTotals calculateStoryPointTotals(List<TaskStoryPoint> storyPoints) {
        long totalStoryPoints = storyPoints.size();
        long completedStoryPoints = storyPoints.stream()
                .filter(point -> point.getStatus() == StoryPointStatus.DONE)
                .count();
        long totalPointValue = storyPoints.stream()
                .mapToLong(point -> point.getPointValue() == null ? 0 : point.getPointValue())
                .sum();
        long completedPointValue = storyPoints.stream()
                .filter(point -> point.getStatus() == StoryPointStatus.DONE)
                .mapToLong(point -> point.getPointValue() == null ? 0 : point.getPointValue())
                .sum();

        return new ProgressTotals(totalStoryPoints, completedStoryPoints, totalPointValue, completedPointValue);
    }

    private TaskStoryPointDto toDto(TaskStoryPoint storyPoint) {
        return TaskStoryPointDto.builder()
                .id(storyPoint.getId())
                .taskId(storyPoint.getTask() == null ? null : storyPoint.getTask().getId())
                .title(storyPoint.getTitle())
                .description(storyPoint.getDescription())
                .pointValue(storyPoint.getPointValue())
                .status(storyPoint.getStatus())
                .completed(storyPoint.getCompleted())
                .completedAt(storyPoint.getCompletedAt())
                .completedBy(storyPoint.getCompletedBy() == null ? null : storyPoint.getCompletedBy().getId())
                .createdAt(storyPoint.getCreatedAt())
                .updatedAt(storyPoint.getUpdatedAt())
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private TaskItem getTask(Long taskId) {
        return taskRepository.findById(Objects.requireNonNull(taskId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private TaskStoryPoint getStoryPoint(Long storyPointId) {
        return storyPointRepository.findById(Objects.requireNonNull(storyPointId))
                .orElseThrow(() -> new ResourceNotFoundException("Story point not found"));
    }

    private void validateAssignedDeveloperCanToggle(User developer, TaskItem task) {
        if (!developer.getAllRoles().contains(Role.DEVELOPER)) {
            throw new AccessDeniedException("Only developers can update story point status");
        }

        if (task.getAssignedTo() == null || task.getAssignedTo().getId() == null) {
            throw new AccessDeniedException("Task is not assigned to a developer");
        }

        if (!Objects.equals(task.getAssignedTo().getId(), developer.getId())) {
            throw new AccessDeniedException("You can only update story points for your assigned tasks");
        }
    }

    private void validateCanCreateStoryPoint(User actor, TaskItem task, Integer newPointValue) {
        if (actor.getAllRoles().contains(Role.ADMIN)) {
            return;
        }

        if (actor.getAllRoles().contains(Role.MANAGER)) {
            Long actorId = actor.getId();
            Long taskCreatorId = task.getCreatedBy() == null ? null : task.getCreatedBy().getId();
            Long projectManagerId = task.getProject() == null || task.getProject().getManager() == null
                    ? null
                    : task.getProject().getManager().getId();

            if (Objects.equals(actorId, taskCreatorId) || Objects.equals(actorId, projectManagerId)) {
                return;
            }
            throw new AccessDeniedException("You are not allowed to manage story points for this task");
        }

        if (actor.getAllRoles().contains(Role.DEVELOPER)) {
            Long assignedDevId = task.getAssignedTo() == null ? null : task.getAssignedTo().getId();
            if (assignedDevId == null) {
                throw new AccessDeniedException("Task is not assigned to a developer");
            }
            if (!Objects.equals(assignedDevId, actor.getId())) {
                throw new AccessDeniedException("You can only add story points for your assigned tasks");
            }
            return;
        }

        throw new AccessDeniedException("Only managers or assigned developers can create story points");
    }

    private void validateManagerCanManageStoryPoints(User actor, TaskItem task) {
        if (actor.getAllRoles().contains(Role.ADMIN)) {
            return;
        }

        if (!actor.getAllRoles().contains(Role.MANAGER)) {
            throw new AccessDeniedException("Only managers can manage story points");
        }

        Long actorId = actor.getId();
        Long taskCreatorId = task.getCreatedBy() == null ? null : task.getCreatedBy().getId();
        Long projectManagerId = task.getProject() == null || task.getProject().getManager() == null
                ? null
                : task.getProject().getManager().getId();

        if (!Objects.equals(actorId, taskCreatorId) && !Objects.equals(actorId, projectManagerId)) {
            throw new AccessDeniedException("You are not allowed to manage story points for this task");
        }
    }

    private void validateCanViewTask(User actor, TaskItem task) {
        if (actor.getAllRoles().contains(Role.ADMIN)) {
            return;
        }

        if (actor.getAllRoles().contains(Role.MANAGER)) {
            Long actorId = actor.getId();
            Long taskCreatorId = task.getCreatedBy() == null ? null : task.getCreatedBy().getId();
            Long projectManagerId = task.getProject() == null || task.getProject().getManager() == null
                    ? null
                    : task.getProject().getManager().getId();

            if (Objects.equals(actorId, taskCreatorId) || Objects.equals(actorId, projectManagerId)) {
                return;
            }
        }

        if (actor.getAllRoles().contains(Role.DEVELOPER)) {
            Long assignedDevId = task.getAssignedTo() == null ? null : task.getAssignedTo().getId();
            if (Objects.equals(actor.getId(), assignedDevId)) {
                return;
            }
        }

        throw new AccessDeniedException("You are not allowed to view this task");
    }

    private void validateCanViewProject(User actor, Project project) {
        if (actor.getAllRoles().contains(Role.ADMIN)) {
            return;
        }

        if (actor.getAllRoles().contains(Role.MANAGER)) {
            Long managerId = project.getManager() == null ? null : project.getManager().getId();
            if (Objects.equals(actor.getId(), managerId)) {
                return;
            }
        }

        if (actor.getAllRoles().contains(Role.DEVELOPER)) {
            boolean assignedToProject = taskRepository.existsByProject_IdAndAssignedTo_Id(project.getId(), actor.getId());
            if (assignedToProject) {
                return;
            }
        }

        throw new AccessDeniedException("You are not allowed to view this project progress");
    }

    private boolean isTaskCompleted(TaskItem task) {
        return task.getStatus() == TaskStatus.DONE || task.getStatus() == TaskStatus.COMPLETED;
    }

    private record ProgressTotals(
            long totalStoryPoints,
            long completedStoryPoints,
            long totalPointValue,
            long completedPointValue
    ) {}
}
