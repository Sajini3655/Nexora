// src/services/managerService.js
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8081"}/api/manager`;

// Helper to add auth headers (if you connect backend later)
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken"); // adjust if stored elsewhere
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

// ==================== Tickets ====================
export const fetchTickets = async () => {
  try {
    // Uncomment when backend is ready
    // const response = await axios.get(`${API_BASE}/tickets`, getAuthHeaders());
    // return response.data;

    // Dummy tickets
    return {
      total: 120,
      open: 45,
      closed: 75,
    };
  } catch (err) {
    console.error("Error fetching tickets:", err);
    return { total: 0, open: 0, closed: 0 };
  }
};

// ==================== Projects ====================
export const fetchProjects = async () => {
  try {
    // Uncomment when backend is ready
    // const response = await axios.get(`${API_BASE}/projects`, getAuthHeaders());
    // return response.data;

    // Dummy projects
    return [
      { id: 1, name: "Project Alpha", progress: 70 },
      { id: 2, name: "Project Beta", progress: 40 },
      { id: 3, name: "Project Gamma", progress: 90 },
    ];
  } catch (err) {
    console.error("Error fetching projects:", err);
    return [];
  }
};

// ==================== AI Summaries ====================
export const fetchAISummaries = async () => {
  try {
    // Uncomment when backend is ready
    // const response = await axios.get(`${API_BASE}/ai-summaries`, getAuthHeaders());
    // return response.data;

    // Dummy AI summaries
    return [
      { id: 1, project: "Project Alpha", summary: "Fixed critical bug in login flow." },
      { id: 2, project: "Project Beta", summary: "Deployed initial version to staging." },
      { id: 3, project: "Project Gamma", summary: "Completed UI redesign." },
    ];
  } catch (err) {
    console.error("Error fetching AI summaries:", err);
    return [];
  }
};

// ==================== Project Details ====================
export const fetchProjectDetails = async (projectId) => {
  try {
    // Uncomment when backend is ready
    // const response = await axios.get(`${API_BASE}/projects/${projectId}`, getAuthHeaders());
    // return response.data;

    // Dummy project details
    const dummyProjects = {
      1: {
        id: 1,
        name: "Project Alpha",
        description: "Alpha project description",
        tasks: [
          { id: 1, name: "Setup project", status: "Done" },
          { id: 2, name: "Implement login", status: "In Progress" },
        ],
      },
      2: {
        id: 2,
        name: "Project Beta",
        description: "Beta project description",
        tasks: [
          { id: 3, name: "Design UI", status: "Done" },
          { id: 4, name: "Integrate API", status: "Pending" },
        ],
      },
      3: {
        id: 3,
        name: "Project Gamma",
        description: "Gamma project description",
        tasks: [
          { id: 5, name: "Testing", status: "In Progress" },
          { id: 6, name: "Deploy to staging", status: "Pending" },
        ],
      },
    };

    return dummyProjects[projectId] || null;
  } catch (err) {
    console.error("Error fetching project details:", err);
    return null;
  }
};
