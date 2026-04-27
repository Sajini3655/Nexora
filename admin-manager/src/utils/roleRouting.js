export function getUserRoles(user) {
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    return user.roles.filter(Boolean).map((role) => String(role).toUpperCase());
  }

  if (Array.isArray(user?.roleNames) && user.roleNames.length > 0) {
    return user.roleNames.filter(Boolean).map((role) => String(role).toUpperCase());
  }

  if (typeof user?.role === "string" && user.role.trim()) {
    return [user.role.trim().toUpperCase()];
  }

  return [];
}

export function getRolePath(role) {
  const value = String(role || "").toUpperCase();

  if (value === "ADMIN") return "/admin";
  if (value === "MANAGER") return "/manager";
  if (value === "DEVELOPER") return "/dev";
  if (value === "CLIENT") return "/client";

  return "/login";
}

export function getDefaultRole(user) {
  const roles = getUserRoles(user);
  const primaryRole = String(user?.role || "").toUpperCase();

  if (primaryRole && roles.includes(primaryRole)) {
    return primaryRole;
  }

  return roles[0] || primaryRole || "";
}

export function getDefaultPath(user) {
  return getRolePath(getDefaultRole(user));
}

export function shouldChooseWorkspace(user) {
  return getUserRoles(user).length > 1;
}

export function setActiveRole(role) {
  localStorage.setItem("activeRole", String(role || "").toUpperCase());
}

export function getActiveRole(user) {
  const roles = getUserRoles(user);
  const saved = String(localStorage.getItem("activeRole") || "").toUpperCase();

  if (saved && roles.includes(saved)) {
    return saved;
  }

  return getDefaultRole(user);
}

