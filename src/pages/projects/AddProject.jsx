import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function AddProject() {
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [tasks, setTasks] = useState([
    { id: Date.now(), title: "", priority: "Medium" }
  ]);

  const addTask = () =>
    setTasks([...tasks, { id: Date.now(), title: "", priority: "Medium" }]);

  const removeTask = (id) =>
    setTasks(tasks.filter((t) => t.id !== id));

  const handleTaskChange = (id, field, value) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  };

  const handleSubmit = () => {
    console.log({ projectName, projectDesc, tasks });
    alert("Project created! Check console for details.");
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Add New Project
      </Typography>

      <TextField
        label="Project Name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        label="Project Description"
        value={projectDesc}
        onChange={(e) => setProjectDesc(e.target.value)}
        sx={{ mb: 4 }}
        multiline
        rows={3}
      />

      <Typography variant="h5" sx={{ mb: 2 }}>
        Tasks
      </Typography>

      {tasks.map((task, idx) => (
        <Paper key={task.id} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label={`Task ${idx + 1} Title`}
              value={task.title}
              onChange={(e) =>
                handleTaskChange(task.id, "title", e.target.value)
              }
              sx={{ flex: 2 }}
            />

            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={task.priority}
                label="Priority"
                onChange={(e) =>
                  handleTaskChange(task.id, "priority", e.target.value)
                }
              >
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>

            <IconButton
              onClick={() => removeTask(task.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Paper>
      ))}

      <Button variant="outlined" sx={{ mr: 2 }} onClick={addTask}>
        Add Task
      </Button>

      <Button variant="contained" onClick={handleSubmit}>
        Create Project
      </Button>
    </Box>
  );
}
