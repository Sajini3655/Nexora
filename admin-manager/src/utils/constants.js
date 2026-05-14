const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, "");

export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  DEVELOPER: "DEVELOPER",
  CLIENT: "CLIENT"
};

