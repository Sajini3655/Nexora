import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  LinearProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ProjectManagement() {
  const navigate = useNavigate();

  // Frontend dummy data
  const projects = [
    {
      id: 1,
      name: "E-Commerce Platform",
      description: "Online shopping system with payment integration.",
      status: "Active",
      progress: 65,
      tasks: 8
    },
    {
      id: 2,
      name: "HR Management System",
      description: "Employee and payroll management.",
      status: "Planning",
      progress: 20,
      tasks: 5
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 4 }}>
        Project Management
      </Typography>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Paper
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "0.3s",
                border: "1px solid rgba(255,255,255,0.06)",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.4)"
                }
              }}
            >
              {/* Top Info */}
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {project.name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mb: 2, opacity: 0.8 }}
                >
                  {project.description}
                </Typography>

                <Chip
                  label={project.status}
                  color={
                    project.status === "Active"
                      ? "success"
                      : project.status === "Planning"
                      ? "warning"
                      : "default"
                  }
                  size="small"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" sx={{ mb: 1 }}>
                  Tasks: {project.tasks}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={project.progress}
                  sx={{ height: 8, borderRadius: 5 }}
                />

                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1 }}
                >
                  {project.progress}% Complete
                </Typography>
              </Box>

              {/* Manage Button */}
              <Button
                variant="contained"
                sx={{ mt: 3 }}
                fullWidth
                onClick={() =>
                  navigate(
                    `/manager/project-management/${project.id}`
                  )
                }
              >
                Manage Project
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
