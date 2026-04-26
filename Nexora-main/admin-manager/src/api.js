import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8081",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUsers = (params) => api.get("/api/admin/users", { params });

export const inviteUser = (payload) => api.post("/api/admin/users/invite", payload);

export const resendInvite = (id) => api.post(`/api/admin/users/${id}/resend-invite`);

export const updateUserStatus = (id, enabled) =>
  api.patch(`/api/admin/users/${id}/status`, { enabled });

export const updateUserRole = (id, role) =>
  api.patch(`/api/admin/users/${id}/role`, { role });

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("DELETE USER ERROR:", error?.response?.data || error.message);
    throw error;
  }
};
export const getRoles = () => api.get("/api/access/roles");

export const createRole = (roleName) => api.post("/api/access/roles", roleName, { headers: { 'Content-Type': 'text/plain' } });

export const updateRolePermissions = (id, permissions) => api.put(`/api/access/roles/${id}/permissions`, permissions);

export const deleteRole = (id) => api.delete(`/api/access/roles/${id}`);

export default api;