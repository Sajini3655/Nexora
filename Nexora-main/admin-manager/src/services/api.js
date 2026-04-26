import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8081/api",
});

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

export const updateAdminUserRole = async (id, role) => {
  const response = await api.patch(`/admin/users/${id}/role`, { role });
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

// Roles Management
export const getRoles = () => api.get("/access/roles");
export const createRole = (roleName) => api.post("/access/roles", roleName, { headers: { 'Content-Type': 'text/plain' } });
export const createRoleWithUser = (payload) => api.post("/access/roles-with-user", payload);
export const updateRolePermissions = (id, permissions) => api.put(`/access/roles/${id}/permissions`, permissions);
export const deleteRole = (id) => api.delete(`/access/roles/${id}`);

export default api;