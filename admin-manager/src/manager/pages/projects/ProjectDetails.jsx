import React, { useEffect, useState } from "react";
import {
  CircularProgress,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  LinearProgress
} from "@mui/material";
import { useParams } from "react-router-dom";
import ChatBox from "../../../dev/pages/chat/src/ChatBox.tsx";
import { fetchProjectDetails } from "../../../services/managerService";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function ProjectDetails() {
  const params = useParams();
  const routeProjectId = params.projectId || params.id;
  const { user, loading: authLoading } = useAuth();

  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const data = await fetchProjectDetails(routeProjectId);
        console.log("FINAL PROJECT DETAILS:", data);
        setProject(data);
      } catch (error) {
        console.error("Failed to load project details", error);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    if (routeProjectId) {
      loadProject();
    } else {
      setLoading(false);
    }
  }, [routeProjectId]);

  const getProjectName = (project) =>
    project?.name || project?.projectName || project?.title || "Untitled Project";

  const getProjectDescription = (project) =>
    project?.description ||
    project?.projectDescription ||
    project?.details ||
    "No description available.";

  const getTaskTitle = (task) =>
    task?.title || task?.taskName || task?.name || "Untitled Task";

  const getTaskStatus = (task) =>
    task?.status || task?.taskStatus || "Unknown";

  const getTaskProgress = (task) => {
    if (task?.progress != null) return task.progress;
    const status = String(task?.status || task?.taskStatus || "").toLowerCase();

    if (status.includes("complete")) return 100;
    if (status.includes("progress")) return 60;
    if (status.includes("pending")) return 20;
    return 0;
  };

  const getDevelopers = (task) => {
    if (Array.isArray(task?.assignedDevelopers)) return task.assignedDevelopers;
    if (Array.isArray(task?.assignees)) return task.assignees;
    if (Array.isArray(task?.developers)) return task.developers;
    if (task?.assignedTo) return [task.assignedTo];
    if (task?.developerName) return [task.developerName];
    return [];
  };

  if (loading || authLoading) {
    return (
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={22} />
        <Typography>Loading project...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Please log in to access project details.</Typography>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Project not found
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Real data did not match this page yet.
        </Typography>

        <Paper sx={{ p: 2, background: "#fff8e1" }}>
          <Typography variant="subtitle2">Debug info</Typography>
          <Typography variant="body2">
            Route param value: {String(routeProjectId || "undefined")}
          </Typography>
          <Typography variant="body2">
            Check browser console for: PROJECTS API RESULT, TASKS API RESULT, FINAL PROJECT DETAILS
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {getProjectName(project)}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        {getProjectDescription(project)}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Tasks
          </Typography>

          {Array.isArray(project.tasks) && project.tasks.length > 0 ? (
            project.tasks.map((task, index) => {
              const developers = getDevelopers(task);
              const progressValue = getTaskProgress(task);

              return (
                <Paper key={task?.id || task?.taskId || index} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {getTaskTitle(task)}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Status: {getTaskStatus(task)}
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    sx={{ height: 8, borderRadius: 5, mb: 1 }}
                  />

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {progressValue}% complete
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {developers.length > 0 ? (
                      developers.map((dev, devIndex) => (
                        <Chip
                          key={devIndex}
                          label={
                            typeof dev === "string"
                              ? dev
                              : dev?.name || dev?.fullName || dev?.username || "Developer"
                          }
                        />
                      ))
                    ) : (
                      <Chip label="No developers assigned" variant="outlined" />
                    )}
                  </Box>
                </Paper>
              );
            })
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography>No tasks found for this project.</Typography>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Project AI Chat
            </Typography>

            <ChatBox
              projectId={String(project?.id || project?.projectId || routeProjectId)}
              currentUserId={String(user.id)}
              currentUserName={user.name || user.email || "Manager"}
              onSummary={setSummary}
            />
          </Paper>

          {summary && (
            <Paper
              sx={{
                p: 3,
                border: "1px solid rgba(99, 102, 241, 0.45)",
                borderLeft: "5px solid #6366f1",
                background:
                  "linear-gradient(180deg, rgba(16, 21, 41, 0.96) 0%, rgba(11, 15, 31, 0.98) 100%)",
                color: "#e6ebff",
                borderRadius: 3,
                boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)"
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, color: "#ffffff", fontWeight: 700 }}>
                AI Summary
              </Typography>

              <Typography variant="body2" sx={{ mb: 2, color: "#d6ddff", lineHeight: 1.6 }}>
                {summary.summary || "No summary available."}
              </Typography>

              {summary.blockers?.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "#f5f7ff", fontWeight: 700 }}>
                    Detected Blockers
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      mb: 2
                    }}
                  >
                    {summary.blockers.map((blocker, index) => (
                      <Chip
                        key={index}
                        label={blocker}
                        variant="outlined"
                        sx={{
                          width: "fit-content",
                          color: "#ff8080",
                          borderColor: "rgba(255, 95, 95, 0.75)",
                          background: "rgba(120, 22, 22, 0.22)",
                          fontWeight: 600
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}

              {summary.ticket_message && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "#f5f7ff", fontWeight: 700 }}>
                    Ticket Status
                  </Typography>

                  <Typography variant="body2" sx={{ color: "#c9d6ff" }}>
                    {summary.ticket_message}
                  </Typography>
                </>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}