import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8081",
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

export default api;