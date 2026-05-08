package com.admin.service;

import com.admin.dto.ProjectResponse;
import com.admin.dto.TaskDto;
import com.admin.dto.TicketDto;
import com.admin.dto.nlq.AiNlqDestination;
import com.admin.dto.nlq.AiNlqResolveRequest;
import com.admin.dto.nlq.AiNlqResolveResponse;
import com.admin.dto.nlq.NlqResolveRequest;
import com.admin.dto.nlq.NlqResolveResponse;
import com.admin.entity.AccessModule;
import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class NlqNavigationService {

    @Value("${app.ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private final UserRepository userRepository;
    private final AccessControlService accessControlService;
    private final ProjectService projectService;
    private final ClientPortalService clientPortalService;
    private final TicketService ticketService;
    private final TaskAssignmentService taskAssignmentService;
    private final DeveloperTaskService developerTaskService;

    private record Destination(
            String id,
            String label,
            String path,
            Set<Role> roles,
            AccessModule requiredModule,
            List<String> keywords,
            boolean supportsQueryParam
    ) {}

    private static final List<Destination> DESTINATIONS = List.of(
            new Destination(
                    "admin.dashboard",
                    "Admin dashboard",
                    "/admin",
                    Set.of(Role.ADMIN),
                    null,
                    List.of("dashboard", "home", "overview", "admin"),
                    false
            ),
            new Destination(
                    "admin.timesheets",
                    "Admin timesheets",
                    "/admin/timesheets",
                    Set.of(Role.ADMIN),
                    null,
                    List.of("timesheets", "time sheets", "approvals"),
                    false
            ),
            new Destination(
                    "admin.access",
                    "Access control",
                    "/access",
                    Set.of(Role.ADMIN),
                    null,
                    List.of("access", "permissions", "role access", "modules"),
                    false
            ),
            new Destination(
                    "admin.settings",
                    "Admin settings",
                    "/settings",
                    Set.of(Role.ADMIN),
                    null,
                    List.of("settings", "preferences", "configuration"),
                    false
            ),
            new Destination(
                    "common.users",
                    "Users",
                    "/users",
                    Set.of(Role.ADMIN, Role.MANAGER),
                    null,
                    List.of("users", "team", "members"),
                    false
            ),
            new Destination(
                    "common.profile",
                    "Profile",
                    "/profile",
                    Set.of(Role.ADMIN, Role.MANAGER),
                    null,
                    List.of("profile", "my profile", "account"),
                    false
            ),

            new Destination(
                    "manager.dashboard",
                    "Manager dashboard",
                    "/manager",
                    Set.of(Role.MANAGER),
                    AccessModule.DASHBOARD,
                    List.of("dashboard", "home", "overview", "manager"),
                    false
            ),
            new Destination(
                    "manager.projects",
                    "Manager projects",
                    "/manager/project-management",
                    Set.of(Role.MANAGER),
                    AccessModule.FILES,
                    List.of("projects", "project management", "workstreams", "work streams"),
                    true
            ),
            new Destination(
                    "manager.add_project",
                    "Add project",
                    "/manager/add-project",
                    Set.of(Role.MANAGER),
                    AccessModule.FILES,
                    List.of("add project", "new project", "create project"),
                    false
            ),
            new Destination(
                    "manager.tickets",
                    "Manager tickets",
                    "/manager/tickets",
                    Set.of(Role.MANAGER),
                    null,
                    List.of("tickets", "inbox", "email tickets", "complaints"),
                    false
            ),
            new Destination(
                    "manager.timesheets",
                    "Manager timesheets",
                    "/manager/timesheets",
                    Set.of(Role.MANAGER),
                    null,
                    List.of("timesheets", "approve timesheets", "team timesheets"),
                    false
            ),
            new Destination(
                    "manager.ai_assignment",
                    "AI assignment",
                    "/manager/ai-assignment",
                    Set.of(Role.MANAGER),
                    AccessModule.TASKS,
                    List.of("ai assignment", "assign tasks", "suggest assignee"),
                    false
            ),

            new Destination(
                    "dev.dashboard",
                    "Developer dashboard",
                    "/dev",
                    Set.of(Role.DEVELOPER),
                    AccessModule.DASHBOARD,
                    List.of("dashboard", "home", "developer"),
                    false
            ),
            new Destination(
                    "dev.projects",
                    "Developer projects",
                    "/dev/projects",
                    Set.of(Role.DEVELOPER),
                    AccessModule.FILES,
                    List.of("projects", "workspaces", "workspace"),
                    false
            ),
            new Destination(
                    "dev.tasks",
                    "Developer tasks",
                    "/dev/tasks",
                    Set.of(Role.DEVELOPER),
                    AccessModule.TASKS,
                    List.of("tasks", "my tasks", "board"),
                    false
            ),
            new Destination(
                    "dev.chat",
                    "Developer chat",
                    "/dev/chat",
                    Set.of(Role.DEVELOPER),
                    AccessModule.CHAT,
                    List.of("chat", "messages"),
                    false
            ),
            new Destination(
                    "dev.profile",
                    "Developer profile",
                    "/dev/profile",
                    Set.of(Role.DEVELOPER),
                    null,
                    List.of("profile", "account"),
                    false
            ),
            new Destination(
                    "dev.settings",
                    "Developer settings",
                    "/dev/settings",
                    Set.of(Role.DEVELOPER),
                    null,
                    List.of("settings"),
                    false
            ),
            new Destination(
                    "dev.timesheets",
                    "Developer timesheets",
                    "/dev/timesheets",
                    Set.of(Role.DEVELOPER),
                    null,
                    List.of("timesheets", "my timesheets"),
                    false
            ),

            new Destination(
                    "client.dashboard",
                    "Client dashboard",
                    "/client",
                    Set.of(Role.CLIENT),
                    null,
                    List.of("dashboard", "home", "client"),
                    false
            ),
            new Destination(
                    "client.projects",
                    "Client projects",
                    "/client/projects",
                    Set.of(Role.CLIENT),
                    null,
                    List.of("projects", "workstreams", "work streams"),
                    true
            ),
            new Destination(
                    "client.tickets",
                    "Client tickets",
                    "/client/tickets",
                    Set.of(Role.CLIENT),
                    null,
                    List.of("tickets", "support", "issues"),
                    true
            ),
            new Destination(
                    "client.history",
                    "Client history",
                    "/client/history",
                    Set.of(Role.CLIENT),
                    null,
                    List.of("history", "activity"),
                    false
            ),
            new Destination(
                    "client.profile",
                    "Client profile",
                    "/client/profile",
                    Set.of(Role.CLIENT),
                    null,
                    List.of("profile"),
                    false
            ),
            new Destination(
                    "client.settings",
                    "Client settings",
                    "/client/settings",
                    Set.of(Role.CLIENT),
                    null,
                    List.of("settings"),
                    false
            )
    );

    public NlqResolveResponse resolve(Authentication authentication, NlqResolveRequest request) {
        try {
            String query = safe(request.getQuery()).trim();
            if (query.isBlank()) {
            return NlqResolveResponse.builder()
                .action("MESSAGE")
                .message("Type a page name, like 'dashboard' or 'projects'.")
                .build();
            }

            String email = authentication == null ? "" : authentication.getName();
            if (email.isBlank()) {
            return NlqResolveResponse.builder()
                .action("MESSAGE")
                .message("Please sign in again and retry.")
                .build();
            }

            User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            Set<Role> userRoles = user.getAllRoles();
            Role activeRole = resolveActiveRole(request.getCurrentRole(), user.getRole(), userRoles);

            Map<String, Boolean> moduleAccess;
            try {
            moduleAccess = accessControlService.getEffectiveAccessForUser(email);
            } catch (Exception ex) {
            moduleAccess = new LinkedHashMap<>();
            }

            List<Destination> allowed = buildAllowedDestinations(activeRole, userRoles, moduleAccess);
            if (allowed.isEmpty()) {
            return NlqResolveResponse.builder()
                .action("MESSAGE")
                .message("No destinations are available for your current workspace.")
                .build();
            }

            // Check for direct command matches before calling AI
            NlqResolveResponse directMatch = resolveDirectCommand(query, activeRole, moduleAccess, authentication, email);
            if (directMatch != null) {
            return directMatch;
            }

            AiNlqResolveResponse ai = callAiResolve(query, activeRole, allowed);

            if (ai != null && "SWITCH_ROLE".equalsIgnoreCase(safe(ai.getAction()))) {
            Role target = tryParseRole(ai.getTargetRole()).orElse(null);
            if (target == null) {
                return NlqResolveResponse.builder()
                    .action("MESSAGE")
                    .message("I couldn't determine which workspace to switch to.")
                    .build();
            }

            if (!userRoles.contains(target)) {
                return NlqResolveResponse.builder()
                    .action("MESSAGE")
                    .message("You don't have permission to access that workspace.")
                    .build();
            }

            return NlqResolveResponse.builder()
                .action("SWITCH_ROLE")
                .targetRole(target.name())
                .message("Switch role to continue.")
                .build();
            }

            if (ai == null || !"NAVIGATE".equalsIgnoreCase(safe(ai.getAction()))) {
            return NlqResolveResponse.builder()
                .action("MESSAGE")
                .message("I couldn't map that to a page in this workspace.")
                .build();
            }

            Destination dest = allowed.stream()
                .filter(d -> Objects.equals(d.id(), safe(ai.getDestinationId())))
                .findFirst()
                .orElse(null);

            if (dest == null) {
            return NlqResolveResponse.builder()
                .action("MESSAGE")
                .message("That page isn't available in your current workspace.")
                .build();
            }

            String entityType = safe(ai.getEntityType()).toUpperCase(Locale.ROOT);
            String entityName = safe(ai.getEntityName()).trim();
            String searchQuery = safe(ai.getSearchQuery()).trim();

            String resolvedPath = resolveEntityOrPath(authentication, email, activeRole, moduleAccess, dest, entityType, entityName, searchQuery, query);
            if (resolvedPath == null || resolvedPath.isBlank()) {
            return NlqResolveResponse.builder()
                .action("MESSAGE")
                .message("I couldn't navigate to that destination.")
                .build();
            }

            return NlqResolveResponse.builder()
                .action("NAVIGATE")
                .path(resolvedPath)
                .build();
        } catch (Exception ex) {
            return NlqResolveResponse.builder()
                .action("MESSAGE")
                .message("Navigation failed. Please try again.")
                .build();
        }
    }

    /**
     * Resolve direct command patterns before consulting AI.
     * Handles edge cases where plural or slight variations don't match expected keywords.
     */
    private NlqResolveResponse resolveDirectCommand(
            String query,
            Role activeRole,
            Map<String, Boolean> moduleAccess,
            Authentication authentication,
            String email
    ) {
        String normalized = normalize(query).toLowerCase(Locale.ROOT);

        // Manager: "add projects" or "add project" -> add project page
        if (activeRole == Role.MANAGER && (normalized.equals("add projects") || normalized.equals("add project"))) {
            if (!Boolean.TRUE.equals(moduleAccess.get(AccessModule.FILES.name()))) {
                return null;
            }
            return NlqResolveResponse.builder()
                    .action("NAVIGATE")
                    .path("/manager/add-project")
                    .build();
        }

        // Manager: "add task" or "add tasks" -> ai assignment page
        if (activeRole == Role.MANAGER && (normalized.equals("add task") || normalized.equals("add tasks"))) {
            if (!Boolean.TRUE.equals(moduleAccess.get(AccessModule.TASKS.name()))) {
                return null;
            }
            return NlqResolveResponse.builder()
                    .action("NAVIGATE")
                    .path("/manager/ai-assignment")
                    .build();
        }

        // Manager: "projects list" or "all projects" -> projects management
        if (activeRole == Role.MANAGER && (normalized.contains("projects list") || normalized.equals("all projects"))) {
            if (!Boolean.TRUE.equals(moduleAccess.get(AccessModule.FILES.name()))) {
                return null;
            }
            return NlqResolveResponse.builder()
                    .action("NAVIGATE")
                    .path("/manager/project-management")
                    .build();
        }

        // No direct match
        return null;
    }

    private String resolveEntityOrPath(
            Authentication authentication,
            String email,
            Role activeRole,
            Map<String, Boolean> moduleAccess,
            Destination dest,
            String entityType,
            String entityName,
            String searchQuery,
            String rawQuery
    ) {
        // Manager: navigate to specific project by name
        if (activeRole == Role.MANAGER && "MANAGER_PROJECT".equals(entityType)) {
            if (!Boolean.TRUE.equals(moduleAccess.get(AccessModule.FILES.name()))) {
                return null;
            }
            String name = entityName.isBlank() ? rawQuery : entityName;
            try {
                List<ProjectResponse> projects = projectService.getMyProjects(authentication);
                Optional<ProjectResponse> match = bestMatch(name, projects, ProjectResponse::getName, 0.58);
                if (match.isPresent()) {
                    return "/manager/project-management/" + url(String.valueOf(match.get().getId()));
                }
            } catch (Exception ignored) {}
            return "/manager/project-management?q=" + url(name);
        }

        // Manager: navigate to tickets list (email inbox)
        if (activeRole == Role.MANAGER && "MANAGER_TICKET".equals(entityType)) {
            String name = entityName.isBlank() ? rawQuery : entityName;
            return "/manager/tickets?q=" + url(name);
        }

        // Manager: navigate to specific task by name
        if (activeRole == Role.MANAGER && "MANAGER_TASK".equals(entityType)) {
            String name = entityName.isBlank() ? rawQuery : entityName;
            try {
                List<TaskDto> tasks = taskAssignmentService.listManagerTasks(email);
                Optional<TaskDto> match = bestMatch(name, tasks, TaskDto::getTitle, 0.58);
                if (match.isPresent()) {
                    return "/manager/tasks/" + url(String.valueOf(match.get().getId()));
                }
            } catch (Exception ignored) {}
            return "/manager/tasks?q=" + url(name);
        }

        // Client: navigate to specific project by name
        if (activeRole == Role.CLIENT && "CLIENT_PROJECT".equals(entityType)) {
            String name = entityName.isBlank() ? rawQuery : entityName;
            try {
                List<ProjectResponse> projects = clientPortalService.getMyProjects(authentication);
                Optional<ProjectResponse> match = bestMatch(name, projects, ProjectResponse::getName, 0.58);
                if (match.isPresent()) {
                    return "/client/projects/" + url(String.valueOf(match.get().getId()));
                }
            } catch (Exception ignored) {}
            return "/client/projects?q=" + url(name);
        }

        // Client: navigate to specific ticket by name or filter tickets
        if (activeRole == Role.CLIENT && "CLIENT_TICKET".equals(entityType)) {
            String name = entityName.isBlank() ? rawQuery : entityName;
            try {
                List<TicketDto> tickets = clientPortalService.getMyTickets(authentication);
                Optional<TicketDto> match = bestMatch(name, tickets, TicketDto::getTitle, 0.58);
                String q = match.map(TicketDto::getTitle).filter(v -> !safe(v).isBlank()).orElse(name);
                return "/client/tickets?q=" + url(q);
            } catch (Exception ignored) {
                return "/client/tickets?q=" + url(name);
            }
        }

        // Developer: navigate to specific task by name
        if (activeRole == Role.DEVELOPER && "DEVELOPER_TASK".equals(entityType)) {
            String name = entityName.isBlank() ? rawQuery : entityName;
            try {
                List<TaskDto> tasks = developerTaskService.listAssignedToMe(email);
                Optional<TaskDto> match = bestMatch(name, tasks, TaskDto::getTitle, 0.58);
                if (match.isPresent()) {
                    return "/dev/tasks/" + url(String.valueOf(match.get().getId()));
                }
            } catch (Exception ignored) {}
            return "/dev/tasks?q=" + url(name);
        }

        // Developer: navigate to specific ticket by name or ID
        if (activeRole == Role.DEVELOPER && "TICKET".equals(entityType)) {
            String name = entityName.isBlank() ? rawQuery : entityName;
            try {
                List<TicketDto> tickets = ticketService.getTicketsForUser(email);
                Optional<TicketDto> match = bestMatch(name, tickets, t -> safe(t.getTitle()) + " " + safe(String.valueOf(t.getId())), 0.58);
                if (match.isPresent()) {
                    return "/dev/tickets/" + url(String.valueOf(match.get().getId()));
                }
                return null;
            } catch (Exception ignored) {
                return null;
            }
        }

        String base = dest.path();
        if (dest.supportsQueryParam()) {
            String q = !searchQuery.isBlank() ? searchQuery : "";
            if (!q.isBlank()) {
                return base + "?q=" + url(q);
            }
        }
        return base;
    }

    private List<Destination> buildAllowedDestinations(Role activeRole, Set<Role> userRoles, Map<String, Boolean> moduleAccess) {
        List<Destination> result = new ArrayList<>();
        boolean isAdmin = activeRole == Role.ADMIN || userRoles.contains(Role.ADMIN);

        for (Destination dest : DESTINATIONS) {
            if (!dest.roles().contains(activeRole)) {
                continue;
            }

            if (!isAdmin && dest.requiredModule() != null) {
                if (!Boolean.TRUE.equals(moduleAccess.get(dest.requiredModule().name()))) {
                    continue;
                }
            }

            result.add(dest);
        }

        return result;
    }

    private AiNlqResolveResponse callAiResolve(String query, Role activeRole, List<Destination> allowed) {
        try {
            List<AiNlqDestination> allowedDto = allowed.stream()
                    .map(d -> AiNlqDestination.builder()
                            .id(d.id())
                            .label(d.label())
                            .path(d.path())
                            .keywords(d.keywords())
                            .build())
                    .toList();

            AiNlqResolveRequest payload = AiNlqResolveRequest.builder()
                    .query(query)
                    .currentRole(activeRole.name())
                    .allowedDestinations(allowedDto)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<AiNlqResolveRequest> request = new HttpEntity<>(payload, headers);

            ResponseEntity<AiNlqResolveResponse> response = restTemplate.postForEntity(
                    aiServiceBaseUrl + "/nlq/resolve",
                    request,
                    AiNlqResolveResponse.class
            );

            return response.getBody();
        } catch (Exception ex) {
            return AiNlqResolveResponse.builder()
                    .action("UNKNOWN")
                    .reason("AI service unavailable: " + ex.getMessage())
                    .build();
        }
    }

    private static Role resolveActiveRole(String currentRole, Role defaultRole, Set<Role> userRoles) {
        Optional<Role> requested = tryParseRole(currentRole);
        if (requested.isPresent() && userRoles.contains(requested.get())) {
            return requested.get();
        }
        return defaultRole == null ? userRoles.stream().findFirst().orElse(Role.CLIENT) : defaultRole;
    }

    private static Optional<Role> tryParseRole(String value) {
        if (value == null || value.isBlank()) return Optional.empty();
        try {
            return Optional.of(Role.valueOf(value.trim().toUpperCase(Locale.ROOT)));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private static String url(String value) {
        return URLEncoder.encode(safe(value), StandardCharsets.UTF_8);
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static <T> Optional<T> bestMatch(String query, List<T> items, Function<T, String> getLabel, double threshold) {
        String q = normalize(query);
        if (q.isBlank() || items == null || items.isEmpty()) return Optional.empty();

        record Scored<T>(T item, double score) {}

        return items.stream()
                .map(item -> new Scored<>(item, score(q, normalize(getLabel.apply(item)))))
                .max(Comparator.comparingDouble(Scored::score))
                .filter(scored -> scored.score() >= threshold)
                .map(Scored::item);
    }

    private static String normalize(String value) {
        if (value == null) return "";
        String lowered = value.toLowerCase(Locale.ROOT);
        String cleaned = lowered.replaceAll("[^a-z0-9]+", " ").trim();
        return cleaned.replaceAll("\\s+", " ");
    }

    private static double score(String a, String b) {
        if (a.isBlank() || b.isBlank()) return 0;
        if (a.equals(b)) return 1.0;
        if (b.contains(a) || a.contains(b)) return 0.92;

        double lev = levenshteinSimilarity(a, b);
        double tok = tokenOverlap(a, b);
        return Math.max(lev, tok);
    }

    private static double tokenOverlap(String a, String b) {
        String[] at = a.split(" ");
        String[] bt = b.split(" ");
        if (at.length == 0 || bt.length == 0) return 0;

        Map<String, Integer> am = new LinkedHashMap<>();
        for (String t : at) {
            if (t.isBlank()) continue;
            am.put(t, am.getOrDefault(t, 0) + 1);
        }

        int intersection = 0;
        int total = 0;
        for (String t : bt) {
            if (t.isBlank()) continue;
            total++;
            Integer count = am.get(t);
            if (count != null && count > 0) {
                intersection++;
                am.put(t, count - 1);
            }
        }

        int denom = Math.max(at.length, bt.length);
        if (denom == 0) return 0;
        return (double) intersection / (double) denom;
    }

    private static double levenshteinSimilarity(String a, String b) {
        int maxLen = Math.max(a.length(), b.length());
        if (maxLen == 0) return 1.0;
        int dist = levenshteinDistance(a, b);
        return 1.0 - ((double) dist / (double) maxLen);
    }

    private static int levenshteinDistance(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];

        for (int j = 0; j <= b.length(); j++) {
            prev[j] = j;
        }

        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            char ca = a.charAt(i - 1);
            for (int j = 1; j <= b.length(); j++) {
                char cb = b.charAt(j - 1);
                int cost = (ca == cb) ? 0 : 1;
                curr[j] = Math.min(
                        Math.min(curr[j - 1] + 1, prev[j] + 1),
                        prev[j - 1] + cost
                );
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }

        return prev[b.length()];
    }
}
