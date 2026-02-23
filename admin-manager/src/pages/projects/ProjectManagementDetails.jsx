import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput,
  Divider
} from "@mui/material";
import { useParams } from "react-router-dom";

const allDevelopers = ["Alice", "Bob", "Charlie", "David"];

export default function ProjectManagementDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);

  useEffect(() => {
    // 🔥 Simulate fetch
    const fetchedProject = {
      id: projectId,
      name: "Sample Project",
      description: "Project description here",
      developers: [],
      files: [],
      tasks: [
        { id: 1, title: "Frontend Setup", priority: "High", status: "Pending", assignedDevelopers: [] },
        { id: 2, title: "Backend API", priority: "Medium", status: "Pending", assignedDevelopers: [] }
      ]
    };

    setProject(fetchedProject);
  }, [projectId]);

  if (!project) return <Typography>Loading...</Typography>;

  const updateProject = (field, value) => {
    setProject({ ...project, [field]: value });
  };

  const updateTask = (taskId, field, value) => {
    setProject({
      ...project,
      tasks: project.tasks.map(t =>
        t.id === taskId ? { ...t, [field]: value } : t
      )
    });
  };

  const handleFileUpload = (e) => {
    const uploaded = Array.from(e.target.files);
    updateProject("files", [...project.files, ...uploaded]);
  };

  const handleSave = () => {
    console.log(project);
    alert("Project updated successfully!");
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Manage: {project.name}
      </Typography>

      {/* ===== Project Developers ===== */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Assign Developers to Project
        </Typography>

        <FormControl fullWidth>
          <InputLabel>Developers</InputLabel>
          <Select
            multiple
            value={project.developers}
            onChange={(e) => updateProject("developers", e.target.value)}
            input={<OutlinedInput label="Developers" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {selected.map(dev => <Chip key={dev} label={dev} />)}
              </Box>
            )}
          >
            {allDevelopers.map(dev => (
              <MenuItem key={dev} value={dev}>{dev}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* ===== Tasks ===== */}
      <Typography variant="h6" sx={{ mb: 2 }}>Tasks</Typography>

      {project.tasks.map(task => (
        <Paper key={task.id} sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {task.title} ({task.priority})
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {/* Status */}
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={task.status}
                label="Status"
                onChange={(e) =>
                  updateTask(task.id, "status", e.target.value)
                }
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>

            {/* Assign Developers */}
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel>Assign Developers</InputLabel>
              <Select
                multiple
                value={task.assignedDevelopers}
                onChange={(e) =>
                  updateTask(task.id, "assignedDevelopers", e.target.value)
                }
                input={<OutlinedInput label="Assign Developers" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {selected.map(dev => <Chip key={dev} label={dev} />)}
                  </Box>
                )}
              >
                {project.developers.map(dev => (
                  <MenuItem key={dev} value={dev}>{dev}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      ))}

      {/* ===== Files ===== */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Upload Files
        </Typography>

        <Button variant="outlined" component="label">
          Upload Files
          <input type="file" hidden multiple onChange={handleFileUpload} />
        </Button>

        <Box sx={{ mt: 2 }}>
          {project.files.map((file, index) => (
            <Typography key={index}>{file.name}</Typography>
          ))}
        </Box>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Button variant="contained" size="large" onClick={handleSave}>
        Save Changes
      </Button>
    </Box>
  );
}
