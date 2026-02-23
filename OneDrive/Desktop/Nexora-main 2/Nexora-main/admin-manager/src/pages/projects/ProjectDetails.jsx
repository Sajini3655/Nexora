import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  LinearProgress
} from "@mui/material";
import { useParams } from "react-router-dom";
import ChatBox from "../chat/src/ChatBox"; // adjust path if needed

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState("");

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
          
          {/* ===== Real AI Chat ===== */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Project AI Chat
            </Typography>

            <ChatBox
              projectId={project.id}
              onSummary={(generatedSummary) =>
                setSummary(generatedSummary)
              }
            />
          </Paper>

          {/* ===== AI Summary Box (Appears After Chat Ends) ===== */}
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

              <Typography variant="body2">
                {summary}
              </Typography>
            </Paper>
          )}

        </Grid>
      </Grid>
    </Box>
  );
}