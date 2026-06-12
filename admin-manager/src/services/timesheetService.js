import api from "./api.js";

const LONG_TIMEOUT = 30000;

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

export const fetchMyTimesheets = () => request(() => api.get("/timesheets/my", { timeout: LONG_TIMEOUT }));

export const fetchMyTimesheetSummary = () => request(() => api.get("/timesheets/my/summary", { timeout: LONG_TIMEOUT }));

export const fetchTimesheetOptions = () => request(() => api.get("/timesheets/options", { timeout: LONG_TIMEOUT }));

export const createTimesheet = (payload) => request(() => api.post("/timesheets", payload, { timeout: LONG_TIMEOUT }));

export const updateTimesheet = (id, payload) => request(() => api.put(`/timesheets/${id}`, payload, { timeout: LONG_TIMEOUT }));

export const deleteTimesheet = (id) => request(() => api.delete(`/timesheets/${id}`, { timeout: LONG_TIMEOUT }));

export const submitTimesheet = (id) => request(() => api.patch(`/timesheets/${id}/submit`, null, { timeout: LONG_TIMEOUT }));

export const fetchTeamTimesheets = (filters = {}) =>
  request(() => api.get("/timesheets/team", { params: normalizeFilters(filters), timeout: LONG_TIMEOUT }));

export const fetchTeamTimesheetSummary = () => request(() => api.get("/timesheets/team/summary", { timeout: LONG_TIMEOUT }));

export const approveTimesheet = (id) => request(() => api.patch(`/timesheets/${id}/approve`, null, { timeout: LONG_TIMEOUT }));

export const rejectTimesheet = (id, reason) => request(() => api.patch(`/timesheets/${id}/reject`, { reason }, { timeout: LONG_TIMEOUT }));

export const fetchAdminTimesheets = (filters = {}) =>
  request(() => api.get("/timesheets/admin", { params: normalizeFilters(filters), timeout: LONG_TIMEOUT }));

export const fetchAdminTimesheetSummary = (filters = {}) =>
  request(() => api.get("/timesheets/admin/summary", { params: normalizeFilters(filters), timeout: LONG_TIMEOUT }));

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

