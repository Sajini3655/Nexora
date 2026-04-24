import React, { useState } from "react";
import {
  Box,
  MenuItem,
  Stack,
  Typography,
  TextField,
  Chip,
  Divider,
} from "@mui/material";
import { createProject } from "../../services/managerService";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const initialTask = { title: "", priority: "MEDIUM" };

export default function AddProject() {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [tasks, setTasks] = useState([{ ...initialTask }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddTask = () => {
    setTasks((prev) => [...prev, { ...initialTask }]);
  };

  const handleRemoveTask = (index) => {
    setTasks((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleTaskChange = (index, field, value) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index ? { ...task, [field]: value } : task
      )
    );
  };

  const validateForm = () => {
    if (!projectName.trim()) return "Project name is required";
    if (!projectDescription.trim()) return "Project description is required";
    if (!tasks.length) return "At least one task is required";

    for (const task of tasks) {
      if (!task.title.trim()) return "Each task must have a title";
      if (!task.priority) return "Each task must have a priority";
    }

    return "";
  };

  const resetForm = () => {
    setProjectName("");
    setProjectDescription("");
    setTasks([{ ...initialTask }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: projectName.trim(),
      description: projectDescription.trim(),
      tasks: tasks.map((task) => ({
        title: task.title.trim(),
        priority: task.priority,
      })),
    };

    try {
      setLoading(true);
      await createProject(payload);
      setSuccess("Project created successfully");
      resetForm();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create project"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      autoComplete="off"
      sx={{
        minHeight: "calc(100vh - 64px)",
        color: "white",
        background:
          "radial-gradient(1100px 500px at 8% -10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(900px 600px at 95% 0%, rgba(59,130,246,0.2), transparent 62%), linear-gradient(180deg, #061229 0%, #040c1f 45%, #030918 100%)",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Box sx={{ mb: 5 }}>
          <Chip
            label="Project Setup"
            size="small"
            sx={{
              mb: 1.5,
              color: "#a7f3d0",
              fontWeight: 700,
              letterSpacing: 0.3,
              backgroundColor: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.35)",
            }}
          />

          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.035em",
              mb: 1,
              lineHeight: 1.05,
              textWrap: "balance",
            }}
          >
            Add New Project
          </Typography>

          <Typography
            sx={{
              color: "rgba(231,233,238,0.78)",
              fontSize: { xs: 16, md: 19 },
              maxWidth: 720,
            }}
          >
            Create a project and break it down into actionable tasks.
          </Typography>
        </Box>

        <Stack spacing={4}>
          <Box
            sx={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))",
              backdropFilter: "blur(16px)",
              borderRadius: 4,
              p: { xs: 2.5, md: 4 },
              boxShadow: "0 25px 85px rgba(0,0,0,0.4)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#bfdbfe",
                  border: "1px solid rgba(96,165,250,0.4)",
                  background: "rgba(59,130,246,0.2)",
                }}
              >
                1
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Project Details
              </Typography>
            </Stack>

            <Stack spacing={3}>
              <Input
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                inputProps={{ autoComplete: "off" }}
                InputProps={{
                  sx: {
                    color: "#fff",
                    "& input::placeholder": {
                      color: "rgba(231,233,238,0.45)",
                      opacity: 1,
                    },
                  },
                }}
              />

              <TextField
                placeholder="Write a short description about this project"
                multiline
                minRows={5}
                fullWidth
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                autoComplete="off"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.8,
                    backgroundColor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(12px)",
                    transition: "all 160ms ease",
                    color: "#fff",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.14)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.22)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgba(59,130,246,0.82)",
                      borderWidth: 1,
                    },
                    "& textarea::placeholder": {
                      color: "rgba(231,233,238,0.45)",
                      opacity: 1,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(231,233,238,0.72)",
                  },
                }}
              />
            </Stack>
          </Box>

          <Box
            sx={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))",
              backdropFilter: "blur(16px)",
              borderRadius: 4,
              p: { xs: 2.5, md: 4 },
              boxShadow: "0 25px 85px rgba(0,0,0,0.4)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#6ee7b7",
                      border: "1px solid rgba(16,185,129,0.4)",
                      background: "rgba(16,185,129,0.16)",
                    }}
                  >
                    2
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    Tasks
                  </Typography>
                </Stack>

                <Typography sx={{ color: "rgba(231,233,238,0.66)" }}>
                  Add the tasks this project should contain.
                </Typography>
              </Box>

              <Chip
                label={`${tasks.length} ${tasks.length === 1 ? "Task" : "Tasks"}`}
                sx={{
                  color: "#6ee7b7",
                  fontWeight: 800,
                  px: 0.5,
                  backgroundColor: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.28)",
                }}
              />
            </Stack>

            <Stack spacing={2.2}>
              {tasks.map((task, index) => (
                <Box
                  key={index}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "linear-gradient(160deg, rgba(8,20,48,0.7), rgba(0,0,0,0.22))",
                    p: { xs: 2, md: 2.5 },
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: "0 auto 0 0",
                      width: 4,
                      background: "linear-gradient(180deg, #10b981, #60a5fa)",
                    }}
                  />

                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.8 }}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "rgba(231,233,238,0.72)",
                        ml: 0.2,
                      }}
                    >
                      Task {index + 1}
                    </Typography>

                    <Chip
                      size="small"
                      label={`#${String(index + 1).padStart(2, "0")}`}
                      sx={{
                        color: "#bfdbfe",
                        fontWeight: 700,
                        backgroundColor: "rgba(59,130,246,0.14)",
                        border: "1px solid rgba(59,130,246,0.3)",
                      }}
                    />
                  </Stack>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      gap: 2,
                      alignItems: { xs: "stretch", md: "center" },
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: { xs: "100%", md: 320 },
                      }}
                    >
                      <TextField
                        fullWidth
                        name={`task-title-${index}`}
                        placeholder={`Task ${index + 1} Title`}
                        value={task.title}
                        onChange={(e) =>
                          handleTaskChange(index, "title", e.target.value)
                        }
                        autoComplete="off"
                        sx={{
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            minHeight: 56,
                            borderRadius: 2.5,
                            backgroundColor: "rgba(255,255,255,0.06)",
                            color: "#fff",
                            "& fieldset": {
                              borderColor: "rgba(255,255,255,0.14)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(255,255,255,0.22)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "rgba(59,130,246,0.82)",
                            },
                          },
                          "& input": {
                            color: "#fff",
                          },
                          "& input::placeholder": {
                            color: "rgba(231,233,238,0.45)",
                            opacity: 1,
                          },
                        }}
                      />
                    </Box>

                    <TextField
                      select
                      value={task.priority}
                      onChange={(e) =>
                        handleTaskChange(index, "priority", e.target.value)
                      }
                      sx={{
                        width: { xs: "100%", md: 180 },
                        flexShrink: 0,
                        "& .MuiOutlinedInput-root": {
                          minHeight: 56,
                          borderRadius: 2.5,
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "#fff",
                          "& fieldset": {
                            borderColor: "rgba(255,255,255,0.14)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(255,255,255,0.22)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "rgba(59,130,246,0.82)",
                          },
                        },
                      }}
                    >
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                    </TextField>

                    <Button
                      type="button"
                      tone="danger"
                      onClick={() => handleRemoveTask(index)}
                      disabled={tasks.length === 1}
                      sx={{
                        minHeight: 56,
                        px: 3,
                        borderRadius: 2.5,
                        alignSelf: { xs: "stretch", md: "auto" },
                        flexShrink: 0,
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              ))}
            </Stack>

            <Divider
              sx={{
                my: 3,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            />

            <Box
              sx={{
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 3,
                background: "rgba(255,255,255,0.04)",
                p: 2,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ mb: error || success ? 2 : 0 }}
              >
                <Button
                  type="button"
                  onClick={handleAddTask}
                  sx={{
                    minHeight: 52,
                    px: 3.5,
                    borderRadius: 2.5,
                    fontWeight: 800,
                  }}
                >
                  Add Task
                </Button>

                <Button
                  type="submit"
                  tone="soft"
                  loading={loading}
                  sx={{
                    minHeight: 52,
                    px: 3.5,
                    borderRadius: 2.5,
                    fontWeight: 800,
                  }}
                >
                  Create Project
                </Button>
              </Stack>

              {error && (
                <Box
                  sx={{
                    mt: 2,
                    borderRadius: 3,
                    border: "1px solid rgba(239,68,68,0.24)",
                    background: "rgba(239,68,68,0.10)",
                    px: 2,
                    py: 1.5,
                    color: "#fca5a5",
                    fontWeight: 500,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {error}
                </Box>
              )}

              {success && (
                <Box
                  sx={{
                    mt: 2,
                    borderRadius: 3,
                    border: "1px solid rgba(34,197,94,0.24)",
                    background: "rgba(34,197,94,0.10)",
                    px: 2,
                    py: 1.5,
                    color: "#86efac",
                    fontWeight: 500,
                  }}
                >
                  {success}
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
