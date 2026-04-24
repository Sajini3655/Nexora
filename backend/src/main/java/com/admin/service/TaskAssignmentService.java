package com.admin.service;

import com.admin.dto.*;
import com.admin.entity.*;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskAssignmentService {

    private final UserRepository userRepository;
    private final DeveloperProfileRepository profileRepository;
    private final DeveloperSkillRepository skillRepository;
    private final TaskRepository taskRepository;

    /**
     * Manager view: list developers with skills + workload.
     */
    @Transactional(readOnly = true)
    public List<DeveloperSummaryDto> listDevelopers() {
        List<User> devUsers = userRepository.findByRoleAndEnabled(Role.DEVELOPER, true);

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

        // score each candidate
        SuggestAssigneeResponse best = null;
        double bestScore = -1;
        for (DeveloperSummaryDto dev : candidates) {
            ScoreResult score = scoreDeveloper(dev, extraction, req.getEstimatedPoints());
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
            assignee = userRepository.findById(req.getAssignedToId())
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

        TaskItem saved = taskRepository.save(task);
        return toTaskDto(saved);
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
                        .capacityPoints(20)
                        .build());

        Integer workload = taskRepository.sumActivePoints(devUser.getId(), TaskStatus.DONE);
        List<DeveloperSkill> skills = profile.getId() == null ? List.of() : skillRepository.findByProfileId(profile.getId());

        List<SkillDto> skillDtos = skills.stream()
                .sorted(Comparator.comparing(DeveloperSkill::getName, String.CASE_INSENSITIVE_ORDER))
                .map(s -> SkillDto.builder().name(s.getName()).level(s.getLevel()).build())
                .collect(Collectors.toList());

        return DeveloperSummaryDto.builder()
                .id(devUser.getId())
                .name(devUser.getName())
                .email(devUser.getEmail())
                .experienceLevel(profile.getExperienceLevel() == null ? ExperienceLevel.JUNIOR : profile.getExperienceLevel())
                .capacityPoints(profile.getCapacityPoints() == null ? 20 : profile.getCapacityPoints())
                .activeWorkloadPoints(workload)
                .skills(skillDtos)
                .build();
    }

    private TaskDto toTaskDto(TaskItem t) {
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
        // simple keyword-based extraction ("AI-like" baseline). Replace with LLM later.
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
            // fallback if nothing detected
            return new SkillExtraction(List.of("General"), Map.of("General", 1.0));
        }

        // weights normalized from hit counts
        Map<String, Double> weights = new LinkedHashMap<>();
        for (var e : hits.entrySet()) {
            weights.put(e.getKey(), e.getValue() / (double) totalHits);
        }
        return new SkillExtraction(new ArrayList<>(weights.keySet()), weights);
    }

    private static class ScoreResult {
        final double total; // 0..1
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

    private ScoreResult scoreDeveloper(DeveloperSummaryDto dev, SkillExtraction extraction, Integer estimatedPoints) {
        Map<String, Integer> devSkillLevels = new HashMap<>();
        for (SkillDto s : dev.getSkills() == null ? List.<SkillDto>of() : dev.getSkills()) {
            if (s.getName() == null) continue;
            devSkillLevels.put(s.getName().trim().toLowerCase(), s.getLevel() == null ? 3 : s.getLevel());
        }

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        // Skill score (0..1)
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

        // Workload score (0..1)
        int cap = dev.getCapacityPoints() == null ? 20 : dev.getCapacityPoints();
        int active = dev.getActiveWorkloadPoints() == null ? 0 : dev.getActiveWorkloadPoints();
        double workloadRatio = cap <= 0 ? 1.0 : Math.min(1.0, active / (double) cap);
        double workloadScore = 1.0 - workloadRatio;

        // Experience fit (0..1)
        double expValue = switch (dev.getExperienceLevel() == null ? ExperienceLevel.JUNIOR : dev.getExperienceLevel()) {
            case JUNIOR -> 0.70;
            case MID -> 0.85;
            case SENIOR -> 1.00;
        };

        double difficulty = estimateDifficulty(extraction.requiredSkills.size(), estimatedPoints);
        double experienceScore = 1.0 - Math.min(0.4, Math.abs(expValue - difficulty));
        experienceScore = clamp(experienceScore, 0.6, 1.0);

        // total (weighted)
        double total = 0.60 * skillScore + 0.25 * workloadScore + 0.15 * experienceScore;
        total = clamp(total, 0.0, 1.0);

        String explanation = buildExplanation(dev, matched, missing, active, cap);

        return new ScoreResult(total, skillScore, workloadScore, experienceScore, matched, missing, explanation);
    }

    private double estimateDifficulty(int requiredSkillCount, Integer estimatedPoints) {
        int pts = estimatedPoints == null ? 0 : estimatedPoints;
        if (pts >= 8 || requiredSkillCount >= 4) return 1.00;   // HARD
        if (pts >= 4 || requiredSkillCount >= 2) return 0.85;   // MEDIUM
        return 0.70;                                            // EASY
    }

    private String buildExplanation(DeveloperSummaryDto dev, List<String> matched, List<String> missing, int active, int cap) {
        StringBuilder sb = new StringBuilder();
        sb.append("Suggested ").append(dev.getName()).append(" because ");

        if (!matched.isEmpty()) {
            sb.append("they match ").append(String.join(", ", matched)).append(" ");
        } else {
            sb.append("no strong skill matches were found ");
        }

        sb.append("and current workload is ").append(active).append("/").append(cap).append(" points.");

        if (!missing.isEmpty() && !missing.contains("General")) {
            sb.append(" Missing skills: ").append(String.join(", ", missing)).append(".");
        }
        return sb.toString();
    }

    private double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }
}
