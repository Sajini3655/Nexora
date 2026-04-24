import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  LinearProgress
} from "@mui/material";
import { useParams } from "react-router-dom";
import ChatBox from "../../dev/pages/chat/src/ChatBox.tsx";
import { fetchProjectDetails } from "../../services/managerService";

export default function ProjectDetails() {
  const params = useParams();
  const routeProjectId = params.projectId || params.id;

  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id && parsedUser?.name) {
          setCurrentUser(parsedUser);
        } else {
          setCurrentUser({ id: 34, name: "Manager" });
        }
      } catch (error) {
        console.error("Invalid user in localStorage", error);
        setCurrentUser({ id: 34, name: "Manager" });
      }
    } else {
      setCurrentUser({ id: 34, name: "Manager" });
    }
  }, []);

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

  if (loading || !currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading project...</Typography>
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
              currentUserId={String(currentUser.id)}
              currentUserName={currentUser.name}
              onSummary={setSummary}
            />
          </Paper>

          {summary && (
            <Paper
              sx={{
                p: 3,
                borderLeft: "5px solid #6366f1",
                background: "#f9fafb"
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                AI Summary
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                {summary.summary || "No summary available."}
              </Typography>

              {summary.blockers?.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
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
                        color="error"
                        variant="outlined"
                        sx={{ width: "fit-content" }}
                      />
                    ))}
                  </Box>
                </>
              )}

              {summary.ticket_message && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Ticket Status
                  </Typography>

                  <Typography variant="body2">
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