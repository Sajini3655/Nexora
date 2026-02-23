package com.admin.service.nlq;

import com.admin.dto.NavType;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Single source of truth for where a Manager is allowed to navigate.
 *
 * IMPORTANT:
 * - Add only destinations that actually exist in your frontend routes.
 * - For SCROLL destinations, routePath is the page that contains that section.
 */
public final class ManagerNavRegistry {

    private ManagerNavRegistry() {}

    public record NavDestination(
            String key,
            NavType type,
            String routePath,
            String targetId,
            Set<String> roles,
            List<String> examples
    ) {}

    // ✅ Keep this list tight. The LLM must choose ONLY from these keys.
    public static final List<NavDestination> ALL = List.of(
            new NavDestination(
                    "MANAGER_DASHBOARD",
                    NavType.ROUTE,
                    "/manager",
                    null,
                    Set.of("MANAGER"),
                    List.of("dashboard", "home", "overview", "main dashboard")
            ),

            new NavDestination(
                    "ADD_PROJECT",
                    NavType.ROUTE,
                    "/manager/add-project",
                    null,
                    Set.of("MANAGER"),
                    List.of(
                            "add project",
                            "add a project",
                            "add new project",
                            "create project",
                            "create a project",
                            "new project",
                            "start project"
                    )
            ),

            new NavDestination(
                    "PROJECT_MANAGEMENT",
                    NavType.ROUTE,
                    "/manager/project-management",
                    null,
                    Set.of("MANAGER"),
                    List.of(
                            "project management",
                            "manage projects",
                            "manage project",
                            "project settings",
                            "manage my projects"
                    )
            ),

            new NavDestination(
                    "AI_TASK_ASSIGNMENT",
                    NavType.ROUTE,
                    "/manager/ai-assignment",
                    null,
                    Set.of("MANAGER"),
                    List.of(
                            "ai assignment",
                            "ai task assignment",
                            "assign tasks",
                            "task assignment",
                            "assign developers"
                    )
            ),

            new NavDestination(
                    "PROJECTS_LIST",
                    NavType.ROUTE,
                    "/manager/projects",
                    null,
                    Set.of("MANAGER"),
                    List.of(
                            "projects",
                            "project list",
                            "all projects",
                            "list projects",
                            "view projects"
                    )
            ),

            // Param route
            new NavDestination(
                    "PROJECT_DETAILS",
                    NavType.ROUTE,
                    "/manager/projects/{projectId}",
                    null,
                    Set.of("MANAGER"),
                    List.of("project details", "open project", "project")
            ),

            // ✅ Same-page navigation (scroll on dashboard)
            new NavDestination(
                    "DASHBOARD_PROJECTS_SECTION",
                    NavType.SCROLL,
                    "/manager",
                    "projectsSection",
                    Set.of("MANAGER"),
                    List.of("projects section", "show projects", "projects area")
            ),
            new NavDestination(
                    "DASHBOARD_TICKETS_SECTION",
                    NavType.SCROLL,
                    "/manager",
                    "ticketsSection",
                    Set.of("MANAGER"),
                    List.of(
                            "tickets",
                            "ticket",
                            "issues",
                            "tickets section",
                            "show tickets",
                            "tickets area",
                            "client tickets",
                            "chat tickets"
                    )
            ),

            // Shared routes in your App.jsx
            new NavDestination(
                    "USERS",
                    NavType.ROUTE,
                    "/users",
                    null,
                    Set.of("MANAGER"),
                    List.of("users", "user list", "team")
            ),
            new NavDestination(
                    "PROFILE",
                    NavType.ROUTE,
                    "/profile",
                    null,
                    Set.of("MANAGER"),
                    List.of("profile", "my profile", "account")
            )
    );

    public static Map<String, NavDestination> byKey() {
        return ALL.stream().collect(Collectors.toMap(NavDestination::key, d -> d));
    }
}