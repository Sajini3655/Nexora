export function normalizeRole(role) {
  if (!role) return null;
  return role.startsWith("ROLE_") ? role.replace("ROLE_", "") : role;
}

export function normalizeRoles(roles = []) {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((role) => normalizeRole(role))
    .filter(Boolean);
}

export function hasRole(user, roles = []) {
  const r = normalizeRole(user?.role);
  return !!r && roles.includes(r);
}

export function hasAnyRole(user, allowedRoles = []) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true;

  const primary = normalizeRole(user?.role);
  const extra = normalizeRoles(user?.roles || []);
  const roleSet = new Set([primary, ...extra].filter(Boolean));

  return allowedRoles.some((role) => roleSet.has(normalizeRole(role)));
}
