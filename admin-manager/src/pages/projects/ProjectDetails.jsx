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

export default function ProjectDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        if (parsedUser?.id && parsedUser?.name) {
          setCurrentUser(parsedUser);
        } else {
          setCurrentUser({
            id: 34,
            name: "Manager"
          });
        }
      } catch (error) {
        console.error("Invalid user in localStorage", error);
        setCurrentUser({
          id: 34,
          name: "Manager"
        });
      }
    } else {
      setCurrentUser({
        id: 34,
        name: "Manager"
      });
    }

    const fakeProject = {
      id: projectId || "2",
      name: "E-Commerce Platform",
      description: "Online shopping platform with payment integration.",
      tasks: [
        {
          id: 1,
          title: "Frontend Setup",
          status: "In Progress",
          progress: 60,
          assignedDevelopers: ["Alice", "Bob"]
        },
        {
          id: 2,
          title: "Backend API",
          status: "Pending",
          progress: 20,
          assignedDevelopers: ["Charlie"]
        }
      ]
    };

    setProject(fakeProject);
  }, [projectId]);

  if (!project || !currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading project...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {project.name}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        {project.description}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Tasks
          </Typography>

          {project.tasks.map((task) => (
            <Paper key={task.id} sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {task.title}
              </Typography>

              <Typography variant="body2" sx={{ mb: 1 }}>
                Status: {task.status}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={task.progress ?? 0}
                sx={{ height: 8, borderRadius: 5, mb: 1 }}
              />

              <Typography variant="body2" sx={{ mb: 2 }}>
                {task.progress ?? 0}% complete
              </Typography>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {task.assignedDevelopers.map((dev) => (
                  <Chip key={dev} label={dev} />
                ))}
              </Box>
            </Paper>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Project AI Chat
            </Typography>

            <ChatBox
              projectId={String(project.id)}
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