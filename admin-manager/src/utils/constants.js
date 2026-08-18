const fallbackBackendUrl = "https://nexora-ab6g.onrender.com";
const localBackendUrl = "http://localhost:8081";

const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? localBackendUrl
    : fallbackBackendUrl);

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, "");

export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  DEVELOPER: "DEVELOPER",
  CLIENT: "CLIENT"
};

