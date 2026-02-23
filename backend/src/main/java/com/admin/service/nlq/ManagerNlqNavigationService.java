package com.admin.service.nlq;

import com.admin.dto.NlqResolveRequest;
import com.admin.dto.NlqResolveResponse;
import com.admin.dto.NavIntent;
import com.admin.dto.NavType;
import com.admin.entity.User;
import com.admin.service.nlq.ManagerNavRegistry.NavDestination;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ManagerNlqNavigationService {

    private static final Pattern JSON_OBJECT = Pattern.compile("\\{.*}\\s*", Pattern.DOTALL);
    private static final Pattern FIRST_INT = Pattern.compile("(\\d+)");
    private static final double FUZZY_PHRASE_SIMILARITY = 0.80;

    private final GroqChatClient groq;
    private final ObjectMapper om;
    private final Map<String, NavDestination> registry;

    public ManagerNlqNavigationService(GroqChatClient groq, ObjectMapper om) {
        this.groq = groq;
        this.om = om;
        this.registry = ManagerNavRegistry.byKey();
    }

    public NlqResolveResponse resolve(NlqResolveRequest req) {
        String role = currentRole().orElse("UNKNOWN");
        if (!"MANAGER".equalsIgnoreCase(role)) {
            return new NlqResolveResponse("NOT_ALLOWED", null, null, null, "Manager only.");
        }

        String query = req.query() == null ? "" : req.query().trim();
        if (query.isBlank()) {
            return new NlqResolveResponse("NOT_FOUND", null, null, null, "Empty query.");
        }

        // 1) quick deterministic fallback (fast + reliable)
        NlqResolveResponse fallback = tryFallback(query);
        if (fallback != null) return fallback;

        // 2) LLM routing
        NavIntent intent;
        try {
            intent = routeWithGroq(query);
        } catch (Exception e) {
            intent = null;
        }

        // If model routing is not configured/available, do not fail the request.
        if (intent == null) {
            return new NlqResolveResponse("NOT_FOUND", null, null, null, "No matching destination.");
        }
        if (intent == null || intent.destinationKey() == null || intent.destinationKey().isBlank()) {
            return new NlqResolveResponse("ERROR", null, null, null, "Bad router output.");
        }

        if ("NOT_FOUND".equalsIgnoreCase(intent.destinationKey())) {
            return new NlqResolveResponse("NOT_FOUND", null, null, null, "No matching destination.");
        }

        NavDestination dest = registry.get(intent.destinationKey());
        if (dest == null) {
            return new NlqResolveResponse("NOT_FOUND", null, null, null, "Unknown destination.");
        }

        // Server-side authorization check (never trust the model)
        if (!dest.roles().contains("MANAGER")) {
            return new NlqResolveResponse("NOT_ALLOWED", null, null, null, "Not allowed.");
        }

        return buildResponse(dest, intent.projectId());
    }

    private NlqResolveResponse buildResponse(NavDestination dest, Integer projectId) {
        if (dest.type() == NavType.ROUTE) {
            String path = dest.routePath();
            if (path != null && path.contains("{projectId}")) {
                if (projectId == null) {
                    return new NlqResolveResponse("AMBIGUOUS", null, null, null, "Which project ID?");
                }
                path = path.replace("{projectId}", String.valueOf(projectId));
            }
            return new NlqResolveResponse("OK", "ROUTE", path, null, null);
        }

        // SCROLL destinations always return both routePath + targetId
        String route = dest.routePath();
        String targetId = dest.targetId();
        if (route == null || targetId == null) {
            return new NlqResolveResponse("ERROR", null, null, null, "Scroll destination misconfigured.");
        }

        return new NlqResolveResponse("OK", "SCROLL", route, targetId, null);
    }

    private NavIntent routeWithGroq(String query) {
        String system = "You are an NLQ navigation router for a project management app. " +
                "Return ONLY a single JSON object with the shape: {\"destinationKey\": string, \"projectId\": number|null}. " +
                "Rules: destinationKey MUST be exactly one of the allowed keys. " +
                "If nothing matches, set destinationKey to NOT_FOUND. " +
                "Do not include any other text.";

        String allowed = ManagerNavRegistry.ALL.stream()
                .map(d -> d.key() + " :: " + String.join(", ", d.examples()))
                .reduce((a, b) -> a + "\n" + b)
                .orElse("");

        String user = "Allowed destinations (key :: examples):\n" + allowed + "\n\n" +
                "User query: " + query;

        String content = groq.chat(system, user);
        String json = extractJsonObject(content).orElse(null);
        if (json == null) return null;

        try {
            return om.readValue(json, NavIntent.class);
        } catch (Exception e) {
            return null;
        }
    }

    NlqResolveResponse tryFallback(String query) {
        String q = normalize(query);
        List<String> tokens = tokenize(q);

        // High-signal routes first
        if (fuzzyContainsAny(q, tokens, List.of(
                "add project",
                "add a project",
                "add new project",
                "create project",
                "create a project",
                "new project",
                "start a project",
                "start project"
        ))) {
            return new NlqResolveResponse("OK", "ROUTE", "/manager/add-project", null, null);
        }

        if (fuzzyContainsAny(q, tokens, List.of(
                "project management",
                "manage projects",
                "manage project",
                "project settings",
                "manage my projects"
        ))) {
            return new NlqResolveResponse("OK", "ROUTE", "/manager/project-management", null, null);
        }

        if (fuzzyContainsAny(q, tokens, List.of(
                "ai assignment",
                "ai task assignment",
                "assign tasks",
                "task assignment",
                "assign developers",
                "auto assign tasks"
        )) || (fuzzyContainsWord(tokens, "ai") && (fuzzyContainsWord(tokens, "assign") || fuzzyContainsWord(tokens, "assignment") || fuzzyContainsWord(tokens, "task")))) {
            return new NlqResolveResponse("OK", "ROUTE", "/manager/ai-assignment", null, null);
        }

        // Users / Profile
        if (fuzzyContainsAny(q, tokens, List.of(
                "users",
                "user list",
                "team",
                "team members",
                "members"
        ))) {
            return new NlqResolveResponse("OK", "ROUTE", "/users", null, null);
        }

        if (fuzzyContainsAny(q, tokens, List.of(
                "profile",
                "my profile",
                "account",
                "my account"
        ))) {
            return new NlqResolveResponse("OK", "ROUTE", "/profile", null, null);
        }

        // Dashboard
        if (fuzzyContainsAny(q, tokens, List.of(
                "dashboard",
                "manager dashboard",
                "home",
                "overview",
                "main dashboard"
        ))) {
            return new NlqResolveResponse("OK", "ROUTE", "/manager", null, null);
        }

        // Sections on dashboard
        boolean wantsSection = fuzzyContainsAny(q, tokens, List.of("section", "area", "on dashboard", "on the dashboard", "dashboard section"));
        if (wantsSection && fuzzyContainsAny(q, tokens, List.of("projects", "project section", "projects section", "show projects"))) {
            return new NlqResolveResponse("OK", "SCROLL", "/manager", "projectsSection", null);
        }

        // Tickets: allow just "tickets" to work, plus typo variants.
        if (fuzzyContainsAny(q, tokens, List.of(
                "tickets",
                "ticket",
                "issues",
                "client tickets",
                "chat tickets",
                "tickets section",
                "show tickets"
        ))) {
            return new NlqResolveResponse("OK", "SCROLL", "/manager", "ticketsSection", null);
        }

        // "project 3" (typo-tolerant on the word "project") -> project details
        Optional<Integer> idOpt = extractFirstInt(q);
        if (idOpt.isPresent() && fuzzyContainsAny(q, tokens, List.of("project", "proj", "prj", "projects", "open project"))) {
            return new NlqResolveResponse("OK", "ROUTE", "/manager/projects/" + idOpt.get(), null, null);
        }

        // Projects list (keep after project details + dashboard sections)
        if (fuzzyContainsAny(q, tokens, List.of(
                "projects",
                "project list",
                "all projects",
                "list projects",
                "view projects"
        ))) {
            return new NlqResolveResponse("OK", "ROUTE", "/manager/projects", null, null);
        }

        return null;
    }

    private static String normalize(String input) {
        if (input == null) return "";
        String s = input.toLowerCase(Locale.ROOT);
        // keep letters/numbers/spaces only
        s = s.replaceAll("[^a-z0-9\\s]", " ");
        s = s.replaceAll("\\s+", " ").trim();
        return s;
    }

    private static List<String> tokenize(String normalized) {
        if (normalized == null || normalized.isBlank()) return List.of();
        return List.of(normalized.split(" "));
    }

    private static boolean fuzzyContainsWord(List<String> queryTokens, String word) {
        if (word == null || word.isBlank() || queryTokens == null || queryTokens.isEmpty()) return false;
        String w = normalize(word);
        for (String t : queryTokens) {
            if (t == null || t.isBlank()) continue;
            if (t.equals(w)) return true;
            if (isCloseToken(t, w)) return true;
        }
        return false;
    }

    private static boolean fuzzyContainsAny(String normalizedQuery, List<String> queryTokens, List<String> phrases) {
        if (phrases == null || phrases.isEmpty()) return false;
        for (String phrase : phrases) {
            if (phrase == null || phrase.isBlank()) continue;
            if (fuzzyContainsPhrase(normalizedQuery, queryTokens, phrase)) return true;
        }
        return false;
    }

    private static boolean fuzzyContainsPhrase(String normalizedQuery, List<String> queryTokens, String phrase) {
        String p = normalize(phrase);
        if (p.isBlank()) return false;

        // Fast path
        if (normalizedQuery.contains(p)) return true;

        List<String> phraseTokens = tokenize(p);
        if (phraseTokens.isEmpty()) return false;

        // Single-word phrase: compare against any token
        if (phraseTokens.size() == 1) {
            return fuzzyContainsWord(queryTokens, phraseTokens.get(0));
        }

        // Multi-word phrase: compare against sliding windows
        int n = phraseTokens.size();
        if (queryTokens.size() < n) return false;

        String phraseStr = String.join(" ", phraseTokens);
        for (int i = 0; i <= queryTokens.size() - n; i++) {
            String window = String.join(" ", queryTokens.subList(i, i + n));
            if (similarity(window, phraseStr) >= FUZZY_PHRASE_SIMILARITY) {
                return true;
            }
        }

        return false;
    }

    private static boolean isCloseToken(String a, String b) {
        if (a == null || b == null) return false;
        if (a.equals(b)) return true;
        if (a.length() <= 2 || b.length() <= 2) return false;

        int dist = levenshtein(a, b);
        int maxLen = Math.max(a.length(), b.length());

        // Tight tolerance for short words, looser for longer words
        int maxAllowed = (maxLen <= 5) ? 1 : (maxLen <= 8 ? 2 : 3);
        if (dist <= maxAllowed) return true;

        return similarity(a, b) >= 0.82;
    }

    private static double similarity(String a, String b) {
        if (a == null || b == null) return 0;
        if (a.equals(b)) return 1.0;
        int maxLen = Math.max(a.length(), b.length());
        if (maxLen == 0) return 1.0;
        int dist = levenshtein(a, b);
        return 1.0 - ((double) dist / (double) maxLen);
    }

    /** Basic Levenshtein distance; sufficient for short NLQ phrases. */
    private static int levenshtein(String a, String b) {
        if (a == null || b == null) return Integer.MAX_VALUE;
        int n = a.length();
        int m = b.length();
        if (n == 0) return m;
        if (m == 0) return n;

        int[] prev = new int[m + 1];
        int[] curr = new int[m + 1];
        for (int j = 0; j <= m; j++) prev[j] = j;

        for (int i = 1; i <= n; i++) {
            curr[0] = i;
            char ca = a.charAt(i - 1);
            for (int j = 1; j <= m; j++) {
                int cost = (ca == b.charAt(j - 1)) ? 0 : 1;
                int del = prev[j] + 1;
                int ins = curr[j - 1] + 1;
                int sub = prev[j - 1] + cost;
                curr[j] = Math.min(Math.min(del, ins), sub);
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }

        return prev[m];
    }

    private Optional<String> currentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) return Optional.empty();
        Object p = auth.getPrincipal();

        if (p instanceof User u && u.getRole() != null) {
            return Optional.ofNullable(u.getRole().name());
        }

        return auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""));
    }

    private Optional<String> extractJsonObject(String text) {
        if (text == null) return Optional.empty();
        Matcher m = JSON_OBJECT.matcher(text.trim());
        if (m.find()) return Optional.of(m.group());
        return Optional.empty();
    }

    private Optional<Integer> extractFirstInt(String text) {
        if (text == null) return Optional.empty();
        Matcher m = FIRST_INT.matcher(text);
        if (m.find()) {
            try {
                return Optional.of(Integer.parseInt(m.group(1)));
            } catch (Exception ignored) {}
        }
        return Optional.empty();
    }
}