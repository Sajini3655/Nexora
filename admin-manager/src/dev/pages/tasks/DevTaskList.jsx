import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import { fetchDeveloperTasks } from "../../services/developerApi";

export default function DevTaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchDeveloperTasks();
        if (!active) return;
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load tasks.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((task) => {
      const text = `${task.title} ${task.description} ${task.status} ${task.priority} ${task.projectName}`.toLowerCase();
      return text.includes(q);
    });
  }, [search, tasks]);

  if (loading) {
    return (
      <DevLayout>
        <Box sx={{ minHeight: "45vh", display: "grid", placeItems: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography color="text.secondary">Loading tasks...</Typography>
          </Stack>
        </Box>
      </DevLayout>
    );
  }

  if (error) {
    return (
      <DevLayout>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </DevLayout>
    );
  }

  return (
    <DevLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>
            Tasks
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)", mt: 0.5 }}>
            Backend-assigned developer tasks from your manager.
          </Typography>
        </Box>

        <TextField
          size="small"
          label="Search tasks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 320 } }}
        />
      </Box>

      <Card sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          {filteredTasks.map((task) => (
            <Box
              key={task.id}
              component="button"
              type="button"
              onClick={() => navigate(`/dev/tasks/${task.id}`)}
              sx={{
                textAlign: "left",
                p: 2,
                borderRadius: 3,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "inherit",
                cursor: "pointer",
                transition: "transform 180ms ease, border-color 180ms ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  borderColor: "rgba(124,92,255,0.28)",
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} noWrap>
                    {task.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.62)", display: "block", mt: 0.5 }}>
                    {task.id} • {task.status} • Project {task.projectName || task.projectId || "-"}
                  </Typography>
                  {task.description ? (
                    <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.78)", mt: 1 }}>
                      {task.description}
                    </Typography>
                  ) : null}
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                  <Box sx={{ px: 1.2, py: 0.6, borderRadius: 999, bgcolor: "rgba(124,92,255,0.16)", border: "1px solid rgba(124,92,255,0.25)", fontSize: 12, fontWeight: 800 }}>
                    {task.priority}
                  </Box>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                    Due {task.dueDate}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}

          {filteredTasks.length === 0 ? (
            <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>
              No tasks found.
            </Typography>
          ) : null}
        </Stack>
      </Card>
    </DevLayout>
  );
}
