export function normalizeRole(role) {
  if (!role) return null;
  return role.startsWith("ROLE_") ? role.replace("ROLE_", "") : role;
}

export function hasRole(user, roles = []) {
  const r = normalizeRole(user?.role);
  return !!r && roles.includes(r);
}
