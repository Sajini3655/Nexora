import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button
} from "@mui/material";
import { useParams } from "react-router-dom";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [chatMessage, setChatMessage] = useState("");

  useEffect(() => {
    // 🔥 Simulated fetch (replace with backend later)
    const fakeProject = {
      id: projectId,
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
      ],
      chat: [
        { id: 1, user: "Alice", message: "Frontend basic layout done." },
        { id: 2, user: "Bob", message: "Working on routing." }
      ],
      summaries: [
        "Frontend 60% complete.",
        "Backend API started."
      ]
    };

    setProject(fakeProject);
  }, [projectId]);

  if (!project) return <Typography>Loading project...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {project.name}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        {project.description}
      </Typography>

      <Grid container spacing={3}>
        {/* ================= LEFT SIDE ================= */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Tasks
          </Typography>

          {project.tasks.map(task => (
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
                {task.assignedDevelopers.map(dev => (
                  <Chip key={dev} label={dev} />
                ))}
              </Box>
            </Paper>
          ))}
        </Grid>

        {/* ================= RIGHT SIDE ================= */}
        <Grid item xs={12} md={4}>
          {/* ===== Chat ===== */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Project Chat
            </Typography>

            <List dense>
              {project.chat.map(msg => (
                <ListItem key={msg.id}>
                  <ListItemText
                    primary={msg.user}
                    secondary={msg.message}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <TextField
              size="small"
              placeholder="Type message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Button variant="contained" fullWidth>
              Send
            </Button>
          </Paper>

          {/* ===== Chat Summaries ===== */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Last Chat Summaries
            </Typography>

            {project.summaries.map((summary, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                • {summary}
              </Typography>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
