import api from "./api.js";

function extractApiError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Request failed."
  );
}

async function request(executor) {
  try {
    const response = await executor();
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export const fetchMyTimesheets = () => request(() => api.get("/timesheets/my"));

export const fetchMyTimesheetSummary = () => request(() => api.get("/timesheets/my/summary"));

export const fetchTimesheetOptions = () => request(() => api.get("/timesheets/options"));

export const createTimesheet = (payload) => request(() => api.post("/timesheets", payload));

export const updateTimesheet = (id, payload) => request(() => api.put(`/timesheets/${id}`, payload));

export const deleteTimesheet = (id) => request(() => api.delete(`/timesheets/${id}`));

export const submitTimesheet = (id) => request(() => api.patch(`/timesheets/${id}/submit`));

export const fetchTeamTimesheets = (filters = {}) => request(() => api.get("/timesheets/team", { params: normalizeFilters(filters) }));

export const fetchTeamTimesheetSummary = () => request(() => api.get("/timesheets/team/summary"));

export const approveTimesheet = (id) => request(() => api.patch(`/timesheets/${id}/approve`));

export const rejectTimesheet = (id, reason) => request(() => api.patch(`/timesheets/${id}/reject`, { reason }));

export const fetchAdminTimesheets = (filters = {}) => request(() => api.get("/timesheets/admin", { params: normalizeFilters(filters) }));

export const fetchAdminTimesheetSummary = (filters = {}) => request(() => api.get("/timesheets/admin/summary", { params: normalizeFilters(filters) }));

function normalizeFilters(filters) {
  const params = {};

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    params[key] = value;
  });

  return params;
}
