import api from "./api";

export const createProject = async (payload) => {
  const response = await api.post("/manager/projects", payload);
  return response.data;
};

export const fetchProjects = async () => {
  const response = await api.get("/manager/projects/mine");
  return response.data;
};

export const getMyProjects = fetchProjects;