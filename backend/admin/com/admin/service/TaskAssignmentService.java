package com.admin.service;

import com.admin.dto.*;
import com.admin.entity.*;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskAssignmentService {

    private static final List<TaskStatus> COMPLETED_TASK_STATUSES = List.of(TaskStatus.DONE, TaskStatus.COMPLETED);

    private final UserRepository userRepository;
    private final DeveloperProfileRepository profileRepository;
    private final DeveloperSkillRepository skillRepository;
    private final TaskRepository taskRepository;
    private final TaskStoryPointRepository storyPointRepository;
    private final LiveUpdatePublisher liveUpdatePublisher;

    /**
     * Manager view: list developers with skills + workload.
     */
    @Transactional(readOnly = true)
    public List<DeveloperSummaryDto> listDevelopers() {
        List<User> devUsers = userRepository.findAll().stream()
            .filter(user -> Boolean.TRUE.equals(user.getEnabled()))
            .filter(user -> user.getAllRoles().contains(Role.DEVELOPER))
            .toList();

        return devUsers.stream()
                .map(this::toDeveloperSummary)
                .sorted(Comparator.comparing(DeveloperSummaryDto::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    /**
     * Suggest best developer for a task.
     */
    @Transactional(readOnly = true)
    public SuggestAssigneeResponse suggest(SuggestAssigneeRequest req) {
        String text = (req.getTitle() + "\n" + (req.getDescription() == null ? "" : req.getDescription())).toLowerCase();

        SkillExtraction extraction = extractRequiredSkills(text);
        List<String> requiredSkills = extraction.requiredSkills;

        List<DeveloperSummaryDto> candidates = listDevelopers();
        if (candidates.isEmpty()) {
            return SuggestAssigneeResponse.builder()
                    .recommendedDeveloper(null)
                    .confidence(0)
                    .explanation("No active developers available.")
                    .requiredSkills(requiredSkills)
                    .matchedSkills(List.of())
                    .missingSkills(requiredSkills)
                    .breakdown(ScoreBreakdownDto.builder().skillScore(0).workloadScore(0).experienceScore(0).build())
                    .build();
        }

        SuggestAssigneeResponse best = null;
        double bestScore = -1;
        for (DeveloperSummaryDto dev : candidates) {
                ScoreResult score = scoreDeveloper(dev, extraction, req.getEstimatedPoints(), text);
            if (score.total > bestScore) {
                bestScore = score.total;
                best = SuggestAssigneeResponse.builder()
                        .recommendedDeveloper(dev)
                        .confidence((int) Math.round(score.total * 100))
                        .explanation(score.explanation)
                        .requiredSkills(requiredSkills)
                        .matchedSkills(score.matchedSkills)
                        .missingSkills(score.missingSkills)
                        .breakdown(ScoreBreakdownDto.builder()
                                .skillScore(score.skillScore)
                                .workloadScore(score.workloadScore)
                                .experienceScore(score.experienceScore)
                                .build())
                        .build();
            }
        }
        return best;
    }

    @Transactional
    public TaskDto createTask(String managerEmail, CreateTaskRequest req) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        User assignee = null;
        if (req.getAssignedToId() != null) {
            assignee = userRepository.findById(Objects.requireNonNull(req.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
        }

        TaskItem task = TaskItem.builder()
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .priority(req.getPriority() == null ? TaskPriority.MEDIUM : req.getPriority())
                .status(TaskStatus.TODO)
                .dueDate(req.getDueDate())
                .estimatedPoints(req.getEstimatedPoints())
                .createdBy(manager)
                .assignedTo(assignee)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        TaskItem saved = Objects.requireNonNull(taskRepository.save(task));
        TaskDto dto = toTaskDto(saved);
        liveUpdatePublisher.publishTasksChanged("created");
        return dto;
    }

    @Transactional
    public TaskDto assignTask(String managerEmail, Long taskId, AssignTaskRequest req) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        TaskItem task = taskRepository.findById(Objects.requireNonNull(taskId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (task.getCreatedBy() == null || task.getCreatedBy().getId() == null
                || !task.getCreatedBy().getId().equals(manager.getId())) {
            throw new ResourceNotFoundException("Task not found");
        }

        User assignee = null;
        if (req != null && req.getAssignedToId() != null) {
            assignee = userRepository.findById(Objects.requireNonNull(req.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));

            if (!assignee.getAllRoles().contains(Role.DEVELOPER)) {
                throw new RuntimeException("Assignee must be a developer.");
            }

            if (!Boolean.TRUE.equals(assignee.getEnabled())) {
                throw new RuntimeException("Assignee must be an active developer.");
            }
        }

        task.setAssignedTo(assignee);
        task.setUpdatedAt(LocalDateTime.now());

        TaskItem saved = taskRepository.save(task);
        TaskDto dto = toTaskDto(saved);
        liveUpdatePublisher.publishTasksChanged("assigned");
        return dto;
    }

    @Transactional
    public TaskDto updateTaskDetails(String managerEmail, Long taskId, UpdateTaskRequest req) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        TaskItem task = taskRepository.findById(Objects.requireNonNull(taskId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (task.getCreatedBy() == null || task.getCreatedBy().getId() == null
                || !task.getCreatedBy().getId().equals(manager.getId())) {
            throw new AccessDeniedException("You can only update your own tasks");
        }

        task.setTitle(req.getTitle().trim());
        task.setDescription(req.getDescription());
        task.setPriority(req.getPriority() == null ? TaskPriority.MEDIUM : req.getPriority());
        task.setDueDate(req.getDueDate());
        if (req.getStatus() != null) {
            task.setStatus(req.getStatus());
        }
        task.setUpdatedAt(LocalDateTime.now());

        TaskItem saved = taskRepository.save(task);
        TaskDto dto = toTaskDto(saved);
        liveUpdatePublisher.publishTasksChanged("updated");
        return dto;
    }

    @Transactional(readOnly = true)
    public List<TaskDto> listManagerTasks(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        return taskRepository.findByCreatedById(manager.getId()).stream()
                .sorted(Comparator.comparing(TaskItem::getCreatedAt).reversed())
                .map(this::toTaskDto)
                .collect(Collectors.toList());
    }

    // --------------------- helpers ---------------------

    private DeveloperSummaryDto toDeveloperSummary(User devUser) {
        DeveloperProfile profile = profileRepository.findByUserId(devUser.getId())
                .orElseGet(() -> DeveloperProfile.builder()
                        .user(devUser)
                        .experienceLevel(ExperienceLevel.JUNIOR)
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                        .capacityPoints(20)
                .weeklyCapacityHours(40)
                .yearsOfExperience(1)
                .specialization("General")
                .timezone("Asia/Colombo")
                        .build());

        Integer workload = taskRepository.sumActivePoints(devUser.getId(), COMPLETED_TASK_STATUSES);
        List<DeveloperSkill> skills = profile.getId() == null ? List.of() : skillRepository.findByProfileId(profile.getId());

        List<SkillDto> skillDtos = skills.stream()
                .sorted(Comparator.comparing(DeveloperSkill::getName, String.CASE_INSENSITIVE_ORDER))
                .map(s -> SkillDto.builder().name(s.getName()).level(s.getLevel()).build())
                .collect(Collectors.toList());

        return DeveloperSummaryDto.builder()
                .id(devUser.getId())
                .name(devUser.getName())
                .email(devUser.getEmail())
            .specialization(profile.getSpecialization())
            .timezone(profile.getTimezone())
                .experienceLevel(profile.getExperienceLevel() == null ? ExperienceLevel.JUNIOR : profile.getExperienceLevel())
            .availabilityStatus(profile.getAvailabilityStatus() == null ? AvailabilityStatus.AVAILABLE : profile.getAvailabilityStatus())
                .capacityPoints(profile.getCapacityPoints() == null ? 20 : profile.getCapacityPoints())
            .weeklyCapacityHours(profile.getWeeklyCapacityHours() == null ? 40 : profile.getWeeklyCapacityHours())
            .yearsOfExperience(profile.getYearsOfExperience() == null ? 1 : profile.getYearsOfExperience())
                .activeWorkloadPoints(workload)
                .skills(skillDtos)
                .build();
    }

    private TaskDto toTaskDto(TaskItem t) {
        long totalStoryPoints = storyPointRepository.countByTaskId(t.getId());
        long completedStoryPoints = storyPointRepository.countByTaskIdAndStatus(t.getId(), StoryPointStatus.DONE);
        long totalPointValue = storyPointRepository.findByTaskIdOrderByCreatedAtAsc(t.getId()).stream()
            .mapToLong(point -> point.getPointValue() == null ? 0 : point.getPointValue())
            .sum();
        long completedPointValue = storyPointRepository.findByTaskIdOrderByCreatedAtAsc(t.getId()).stream()
            .filter(point -> point.getStatus() == StoryPointStatus.DONE)
            .mapToLong(point -> point.getPointValue() == null ? 0 : point.getPointValue())
            .sum();
        int progressPercentage = totalPointValue > 0
            ? (int) Math.round((completedPointValue * 100.0) / totalPointValue)
            : (totalStoryPoints == 0 ? 0 : (int) Math.round((completedStoryPoints * 100.0) / totalStoryPoints));

        return TaskDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus())
                .priority(t.getPriority())
                .dueDate(t.getDueDate())
                .estimatedPoints(t.getEstimatedPoints())
                .createdById(t.getCreatedBy() == null ? null : t.getCreatedBy().getId())
                .assignedToId(t.getAssignedTo() == null ? null : t.getAssignedTo().getId())
                .assignedToName(t.getAssignedTo() == null ? null : t.getAssignedTo().getName())
                .createdAt(t.getCreatedAt())
                .projectId(t.getProject() == null ? null : t.getProject().getId())
                .projectName(t.getProject() == null ? null : t.getProject().getName())
                .totalStoryPoints(totalStoryPoints)
                .completedStoryPoints(completedStoryPoints)
                .totalPointValue(totalPointValue)
                .completedPointValue(completedPointValue)
                .progressPercentage(progressPercentage)
                .build();
    }

    private static class SkillExtraction {
        final List<String> requiredSkills;
        final Map<String, Double> weights;

        SkillExtraction(List<String> requiredSkills, Map<String, Double> weights) {
            this.requiredSkills = requiredSkills;
            this.weights = weights;
        }
    }

    private SkillExtraction extractRequiredSkills(String text) {
        Map<String, List<String>> keywords = new LinkedHashMap<>();
        keywords.put("React", List.of("react", "jsx", "component", "frontend", "ui"));
        keywords.put("Node.js", List.of("node", "express", "api", "backend", "jwt", "auth"));
        keywords.put("Database", List.of("database", "sql", "schema", "query", "postgres", "mysql", "h2"));
        keywords.put("UI Design", List.of("figma", "ux", "design", "wireframe", "layout"));
        keywords.put("Spring Boot", List.of("spring", "springboot", "java", "controller", "service"));
        keywords.put("Testing", List.of("test", "testing", "junit", "jest", "bug", "bugfix"));
        keywords.put("DevOps", List.of("docker", "deploy", "pipeline", "ci", "cd"));

        Map<String, Integer> hits = new LinkedHashMap<>();
        int totalHits = 0;
        for (var e : keywords.entrySet()) {
            int c = 0;
            for (String k : e.getValue()) {
                if (text.contains(k)) c++;
            }
            if (c > 0) {
                hits.put(e.getKey(), c);
                totalHits += c;
            }
        }

        if (hits.isEmpty()) {
            return new SkillExtraction(List.of("General"), Map.of("General", 1.0));
        }

        Map<String, Double> weights = new LinkedHashMap<>();
        for (var e : hits.entrySet()) {
            weights.put(e.getKey(), e.getValue() / (double) totalHits);
        }
        return new SkillExtraction(new ArrayList<>(weights.keySet()), weights);
    }

    private static class ScoreResult {
        final double total;
        final double skillScore;
        final double workloadScore;
        final double experienceScore;
        final List<String> matchedSkills;
        final List<String> missingSkills;
        final String explanation;

        ScoreResult(double total, double skillScore, double workloadScore, double experienceScore,
                    List<String> matchedSkills, List<String> missingSkills, String explanation) {
            this.total = total;
            this.skillScore = skillScore;
            this.workloadScore = workloadScore;
            this.experienceScore = experienceScore;
            this.matchedSkills = matchedSkills;
            this.missingSkills = missingSkills;
            this.explanation = explanation;
        }
    }

    private ScoreResult scoreDeveloper(DeveloperSummaryDto dev, SkillExtraction extraction, Integer estimatedPoints, String taskText) {
        Map<String, Integer> devSkillLevels = new HashMap<>();
        for (SkillDto s : dev.getSkills() == null ? List.<SkillDto>of() : dev.getSkills()) {
            if (s.getName() == null) continue;
            devSkillLevels.put(s.getName().trim().toLowerCase(), s.getLevel() == null ? 3 : s.getLevel());
        }

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        double skillScore = 0.0;
        for (String reqSkill : extraction.requiredSkills) {
            double w = extraction.weights.getOrDefault(reqSkill, 0.0);
            Integer lvl = devSkillLevels.get(reqSkill.toLowerCase());
            if (lvl != null) {
                matched.add(reqSkill);
                double normalized = Math.min(1.0, Math.max(0.0, lvl / 5.0));
                skillScore += w * normalized;
            } else {
                missing.add(reqSkill);
            }
        }

        int cap = dev.getCapacityPoints() == null ? 20 : dev.getCapacityPoints();
        int active = dev.getActiveWorkloadPoints() == null ? 0 : dev.getActiveWorkloadPoints();
        double workloadRatio = cap <= 0 ? 1.0 : Math.min(1.0, active / (double) cap);
        double workloadScore = 1.0 - workloadRatio;

        double expValue = switch (dev.getExperienceLevel() == null ? ExperienceLevel.JUNIOR : dev.getExperienceLevel()) {
            case JUNIOR -> 0.70;
            case MID -> 0.85;
            case SENIOR -> 1.00;
        };
        double yearsScore = clamp((dev.getYearsOfExperience() == null ? 1 : dev.getYearsOfExperience()) / 10.0, 0.35, 1.0);
        double experienceScore = clamp((expValue * 0.7) + (yearsScore * 0.3), 0.6, 1.0);

        double availabilityScore = switch (dev.getAvailabilityStatus() == null ? AvailabilityStatus.AVAILABLE : dev.getAvailabilityStatus()) {
            case AVAILABLE -> 1.00;
            case LIMITED -> 0.82;
            case BUSY -> 0.55;
            case UNAVAILABLE -> 0.12;
        };
        int weeklyHours = dev.getWeeklyCapacityHours() == null ? 40 : dev.getWeeklyCapacityHours();
        availabilityScore = clamp(availabilityScore * clamp(weeklyHours / 40.0, 0.5, 1.0), 0.1, 1.0);

        double specializationScore = specializationScore(taskText, dev.getSpecialization(), extraction.requiredSkills);

        double difficulty = estimateDifficulty(extraction.requiredSkills.size(), estimatedPoints);

        double total =
                0.48 * skillScore +
                0.18 * workloadScore +
                0.14 * experienceScore +
                0.12 * availabilityScore +
                0.08 * specializationScore;
        total = clamp(total, 0.0, 1.0);

        String explanation = buildExplanation(dev, matched, missing, active, cap, availabilityScore, specializationScore, difficulty);

        return new ScoreResult(total, skillScore, workloadScore, experienceScore, matched, missing, explanation);
    }

    private double estimateDifficulty(int requiredSkillCount, Integer estimatedPoints) {
        int pts = estimatedPoints == null ? 0 : estimatedPoints;
        if (pts >= 8 || requiredSkillCount >= 4) return 1.00;
        if (pts >= 4 || requiredSkillCount >= 2) return 0.85;
        return 0.70;
    }

    private double specializationScore(String taskText, String specialization, List<String> requiredSkills) {
        if (specialization == null || specialization.isBlank()) return 0.5;

        String normalized = specialization.toLowerCase();
        String[] tokens = normalized.split("[^a-z0-9]+");
        for (String token : tokens) {
            if (token.isBlank()) continue;
            if (taskText.contains(token)) {
                return 1.0;
            }
            for (String skill : requiredSkills) {
                if (skill != null && skill.toLowerCase().contains(token)) {
                    return 1.0;
                }
            }
        }
        return 0.65;
    }

    private String buildExplanation(DeveloperSummaryDto dev, List<String> matched, List<String> missing, int active, int cap, double availabilityScore, double specializationScore, double difficulty) {
        StringBuilder sb = new StringBuilder();
        sb.append("Suggested ").append(dev.getName()).append(" because ");

        if (!matched.isEmpty()) {
            sb.append("they match ").append(String.join(", ", matched)).append(" ");
        } else {
            sb.append("no strong skill matches were found ");
        }

        sb.append("current workload is ").append(active).append("/").append(cap).append(" points, ");
        sb.append("availability is ").append(dev.getAvailabilityStatus() == null ? AvailabilityStatus.AVAILABLE : dev.getAvailabilityStatus()).append(", ");
        sb.append("and specialization is ").append(dev.getSpecialization() == null || dev.getSpecialization().isBlank() ? "General" : dev.getSpecialization()).append(".");

        if (availabilityScore < 0.7) {
            sb.append(" Availability is reducing the score.");
        }

        if (specializationScore >= 0.95) {
            sb.append(" Specialization aligns with this task.");
        }

        sb.append(" Estimated difficulty: ").append(String.format(java.util.Locale.US, "%.2f", difficulty)).append(".");

        if (!missing.isEmpty() && !missing.contains("General")) {
            sb.append(" Missing skills: ").append(String.join(", ", missing)).append(".");
        }
        return sb.toString();
    }

    private double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }
}
