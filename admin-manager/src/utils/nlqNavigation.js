// src/utils/nlqNavigation.js

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const s = String(a || "");
  const t = String(b || "");

  if (s === t) return 0;
  if (!s) return t.length;
  if (!t) return s.length;

  const m = s.length;
  const n = t.length;

  // two-row DP
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);

  for (let j = 0; j <= n; j += 1) prev[j] = j;

  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    const sChar = s.charCodeAt(i - 1);
    for (let j = 1; j <= n; j += 1) {
      const cost = sChar === t.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[n];
}

function similarity(a, b) {
  const x = normalize(a);
  const y = normalize(b);
  const maxLen = Math.max(x.length, y.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(x, y);
  return 1 - dist / maxLen;
}

function tokenContainScore(query, candidate) {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;

  if (c.includes(q)) return 0.98;

  const qTokens = q.split(/\s+/).filter(Boolean);
  if (qTokens.length === 0) return 0;

  const cTokens = new Set(c.split(/\s+/).filter(Boolean));
  const hitCount = qTokens.reduce((acc, token) => acc + (cTokens.has(token) ? 1 : 0), 0);
  return hitCount / qTokens.length;
}

function scoreCandidate(query, candidate) {
  // Blend a "contains/tokens" score with edit-distance similarity.
  const contain = tokenContainScore(query, candidate);
  const sim = similarity(query, candidate);
  return Math.max(contain, sim * 0.92);
}

export function parseNlqQuery(raw) {
  const original = String(raw || "");
  const lowered = original.toLowerCase();

  const stripped = lowered
    .replace(/^(please\s+)?(go\s*to|goto|go|navigate\s*to|navigate|open|show|take\s+me\s*to|take\s+me|view)\s+/i, "")
    .replace(/\s+(page|screen)$/i, "")
    .trim();

  const entityHint =
    /\bproject(s)?\b/i.test(stripped)
      ? "project"
      : /\bticket(s)?\b/i.test(stripped)
        ? "ticket"
        : /\btask(s)?\b/i.test(stripped)
          ? "task"
          : /\btime\s*sheet(s)?\b|\btimesheet(s)?\b/i.test(stripped)
            ? "timesheet"
            : "";

  // Extract entity name: remove leading navigation words and entity type keywords
  let text = stripped
    .replace(/^(the\s+)?project(s)?\b\s*/i, "")
    .replace(/^(the\s+)?ticket(s)?\b\s*/i, "")
    .replace(/^(the\s+)?task(s)?\b\s*/i, "")
    .trim();

  // If text is still empty after removing entity keywords, use the full stripped version
  if (!text && stripped) {
    text = stripped;
  }

  return {
    original,
    text: text || stripped,
    entityHint,
  };
}

function isAllowedByModule(role, requiredModule, moduleAccess) {
  if (!requiredModule) return true;
  if (String(role || "").toUpperCase() === "ADMIN") return true;
  return Boolean(moduleAccess?.[requiredModule]);
}

const NAV_ITEMS = [
  // ADMIN
  {
    role: "ADMIN",
    label: "Admin Dashboard",
    path: "/admin",
    keywords: ["admin", "admin dashboard", "dashboard", "home"],
  },
  {
    role: "ADMIN",
    label: "Access Control",
    path: "/access",
    keywords: ["access", "access control", "permissions", "roles", "rbac"],
  },
  {
    role: "ADMIN",
    label: "Admin Settings",
    path: "/settings",
    keywords: ["settings", "admin settings", "configuration", "config"],
  },
  {
    role: "ADMIN",
    label: "Admin Timesheets",
    path: "/admin/timesheets",
    keywords: ["timesheets", "admin timesheets", "time sheets"],
  },
  {
    role: "ADMIN",
    label: "Users",
    path: "/users",
    keywords: ["users", "user list", "accounts", "team"],
  },
  {
    role: "ADMIN",
    label: "My Profile",
    path: "/profile",
    keywords: ["profile", "my profile", "account", "me"],
  },

  // MANAGER
  {
    role: "MANAGER",
    label: "Manager Dashboard",
    path: "/manager",
    requiredModule: "DASHBOARD",
    keywords: ["manager dashboard", "dashboard", "home"],
  },
  {
    role: "MANAGER",
    label: "Manager Projects",
    path: "/manager/project-management",
    requiredModule: "FILES",
    keywords: ["projects", "project management", "files", "manager projects"],
  },
  {
    role: "MANAGER",
    label: "Add Project",
    path: "/manager/add-project",
    requiredModule: "FILES",
    keywords: ["add project", "new project", "create project"],
  },
  {
    role: "MANAGER",
    label: "Manager Tickets",
    path: "/manager/tickets",
    keywords: ["tickets", "manager tickets", "inbox"],
  },
  {
    role: "MANAGER",
    label: "Manager Timesheets",
    path: "/manager/timesheets",
    keywords: ["timesheets", "time sheets", "manager timesheets"],
  },
  {
    role: "MANAGER",
    label: "AI Assignment",
    path: "/manager/ai-assignment",
    requiredModule: "TASKS",
    keywords: ["ai", "assignment", "ai assignment", "tasks", "suggest"],
  },
  {
    role: "MANAGER",
    label: "Users",
    path: "/users",
    keywords: ["users", "user list", "accounts", "team"],
  },
  {
    role: "MANAGER",
    label: "My Profile",
    path: "/profile",
    keywords: ["profile", "my profile", "account", "me"],
  },

  // DEVELOPER
  {
    role: "DEVELOPER",
    label: "Developer Dashboard",
    path: "/dev",
    requiredModule: "DASHBOARD",
    keywords: ["dev dashboard", "developer dashboard", "dashboard", "home"],
  },
  {
    role: "DEVELOPER",
    label: "Developer Tasks",
    path: "/dev/tasks",
    requiredModule: "TASKS",
    keywords: ["tasks", "my tasks", "task list"],
  },
  {
    role: "DEVELOPER",
    label: "Developer Projects",
    path: "/dev/projects",
    requiredModule: "FILES",
    keywords: ["projects", "files", "dev projects"],
  },
  {
    role: "DEVELOPER",
    label: "Developer Chat",
    path: "/dev/chat",
    requiredModule: "CHAT",
    keywords: ["chat", "messages", "project chat"],
  },
  {
    role: "DEVELOPER",
    label: "Developer Profile",
    path: "/dev/profile",
    keywords: ["profile", "my profile", "account", "me"],
  },
  {
    role: "DEVELOPER",
    label: "Developer Settings",
    path: "/dev/settings",
    keywords: ["settings", "preferences"],
  },
  {
    role: "DEVELOPER",
    label: "Developer Timesheets",
    path: "/dev/timesheets",
    keywords: ["timesheets", "time sheets"],
  },

  // CLIENT
  {
    role: "CLIENT",
    label: "Client Dashboard",
    path: "/client",
    keywords: ["client dashboard", "dashboard", "home"],
  },
  {
    role: "CLIENT",
    label: "Client Projects",
    path: "/client/projects",
    keywords: ["projects", "my projects", "workstreams", "work streams"],
  },
  {
    role: "CLIENT",
    label: "Client Tickets",
    path: "/client/tickets",
    keywords: ["tickets", "support", "help"],
  },
  {
    role: "CLIENT",
    label: "Client History",
    path: "/client/history",
    keywords: ["history", "activity"],
  },
  {
    role: "CLIENT",
    label: "Client Profile",
    path: "/client/profile",
    keywords: ["profile", "my profile", "account", "me"],
  },
  {
    role: "CLIENT",
    label: "Client Settings",
    path: "/client/settings",
    keywords: ["settings", "preferences"],
  },
];

function bestNavMatch(query, role, moduleAccess, { includeOtherRoles = false } = {}) {
  const q = String(query || "").trim();
  if (!q) return null;

  const candidates = NAV_ITEMS.filter((item) => {
    if (!includeOtherRoles && item.role !== role) return false;
    return isAllowedByModule(item.role, item.requiredModule, moduleAccess);
  });

  let best = null;

  for (const item of candidates) {
    const keyPhrases = [item.label, ...item.keywords];
    const score = Math.max(...keyPhrases.map((phrase) => scoreCandidate(q, phrase)));
    if (!best || score > best.score) {
      best = { item, score };
    }
  }

  return best;
}

export function resolveNlqRoute(rawQuery, { currentRole, moduleAccess }) {
  const parsed = parseNlqQuery(rawQuery);
  const role = String(currentRole || "").toUpperCase();

  // 1) Try the current role first.
  const bestForRole = bestNavMatch(parsed.text, role, moduleAccess);
  if (bestForRole && bestForRole.score >= 0.72) {
    return {
      type: "route",
      path: bestForRole.item.path,
      label: bestForRole.item.label,
      confidence: bestForRole.score,
    };
  }

  // 2) If it strongly matches another role, tell user to switch roles.
  const bestAcrossRoles = bestNavMatch(parsed.text, role, moduleAccess, { includeOtherRoles: true });
  if (bestAcrossRoles && bestAcrossRoles.score >= 0.78 && bestAcrossRoles.item.role !== role) {
    return {
      type: "switch-role",
      targetRole: bestAcrossRoles.item.role,
      label: bestAcrossRoles.item.label,
      confidence: bestAcrossRoles.score,
    };
  }

  // 3) If it matches a current-role item but is blocked by a module, report that.
  // We do this by re-scoring without module filtering.
  const bestIgnoringModule = (() => {
    const q = String(parsed.text || "").trim();
    if (!q) return null;
    const candidates = NAV_ITEMS.filter((item) => item.role === role);
    let best = null;
    for (const item of candidates) {
      const keyPhrases = [item.label, ...(item.keywords || [])];
      const score = Math.max(...keyPhrases.map((phrase) => scoreCandidate(q, phrase)));
      if (!best || score > best.score) best = { item, score };
    }
    return best;
  })();

  if (bestIgnoringModule && bestIgnoringModule.score >= 0.72) {
    const required = bestIgnoringModule.item.requiredModule;
    if (required && !isAllowedByModule(role, required, moduleAccess)) {
      return {
        type: "module-blocked",
        requiredModule: required,
        label: bestIgnoringModule.item.label,
      };
    }
  }

  return { type: "no-route", parsed };
}

export function bestEntityMatch(query, entities, { getLabel, getId, threshold = 0.62 } = {}) {
  const q = String(query || "").trim();
  const list = Array.isArray(entities) ? entities : [];
  if (!q || list.length === 0) return null;

  let best = null;
  for (const entity of list) {
    const label = getLabel ? getLabel(entity) : String(entity?.name || entity?.title || "");
    const score = scoreCandidate(q, label);
    if (!best || score > best.score) {
      best = {
        entity,
        id: getId ? getId(entity) : String(entity?.id ?? ""),
        label,
        score,
      };
    }
  }

  if (!best || best.score < threshold) return null;
  return best;
}
