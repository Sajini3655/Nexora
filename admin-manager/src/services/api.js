import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // Fail fast on hung requests to avoid UI stuck states
  timeout: 10000,
});

// Surface auth and network errors in a consistent shape
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error message structure for getErrorMessage usage
    if (error?.response) {
      return Promise.reject(error);
    }

    // Network / timeout / CORS errors
    const timeout = error?.code === 'ECONNABORTED' || String(error?.message || '').toLowerCase().includes('timeout');
    const message = timeout ? 'Request timed out. Please try again.' : error?.message || 'Network error.';
    return Promise.reject(new Error(message));
  }
);
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAdminDashboard = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

export const getAdminDashboardStats = async () => {
  const response = await api.get("/admin/dashboard/stats");
  return response.data;
};

export const getRecentUsers = async () => {
  const response = await api.get("/admin/dashboard/recent-users");
  return response.data;
};

export const getSystemHealth = async () => {
  const response = await api.get("/admin/dashboard/system-health");
  return response.data;
};

export const getRegistrationsLast7Days = async () => {
  const response = await api.get("/admin/dashboard/registrations-last-7-days");
  return response.data;
};

export const getAdminActivity = async () => {
  const response = await api.get("/admin/dashboard/activity");
  return response.data;
};

export const getAdminUsers = async (params) => {
  const response = await api.get("/admin/users", { params });
  return response.data;
};

export const inviteAdminUser = async (payload) => {
  const response = await api.post("/admin/users/invite", payload);
  return response.data;
};

export const resendInvite = async (id) => {
  const response = await api.post(`/admin/users/${id}/resend-invite`);
  return response.data;
};

export const updateAdminUserStatus = async (id, enabled) => {
  const response = await api.patch(`/admin/users/${id}/status`, { enabled });
  return response.data;
};

export const updateAdminUserRole = async (id, payload) => {
  const response = await api.patch(`/admin/users/${id}/role`, payload);
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const getAccessModules = async () => {
  const response = await api.get("/admin/access/modules");
  return response.data;
};

export const getAccessRoles = async () => {
  const response = await api.get("/admin/access/roles");
  return response.data;
};

export const getAccessRoleMatrix = async () => {
  const response = await api.get("/admin/access/role-matrix");
  return response.data;
};

export const saveAccessRoleMatrix = async (payload) => {
  const response = await api.put("/admin/access/role-matrix", payload);
  return response.data;
};

export const getAccessUsers = async (params) => {
  const response = await api.get("/admin/access/users", { params });
  return response.data;
};

export const getAccessUserOverrides = async (userId) => {
  const response = await api.get("/admin/access/user-overrides", {
    params: { userId },
  });
  return response.data;
};

export const saveAccessUserOverrides = async (payload) => {
  const response = await api.put("/admin/access/user-overrides", payload);
  return response.data;
};

export default api;
