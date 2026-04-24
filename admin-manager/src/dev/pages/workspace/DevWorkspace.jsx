import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import {
  deriveSingleProject,
  fetchDeveloperTasks,
  isCompletedTask,
} from "../../services/developerApi";

function ProgressBar({ value }) {
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ height: 6, borderRadius: 999, bgcolor: "rgba(255,255,255,0.1)" }}>
        <Box
          sx={{
            width: `${value}%`,
            height: 6,
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.9))",
          }}
        />
      </Box>
    </Box>
  );
}

export default function DevWorkspace() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
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
        setError(err?.message || "Failed to load project workspace.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const project = useMemo(() => deriveSingleProject(tasks), [tasks]);
  const projectTasks = useMemo(() => {
    if (!id) return [];
    return tasks.filter((task) => String(task.projectId) === String(id));
  }, [tasks, id]);

  const activeProject = project?.id && String(project.id) === String(id) ? project : project;
  const visibleTasks = projectTasks.length > 0 ? projectTasks : project?.tasks || [];
  const openTasks = visibleTasks.filter((task) => !isCompletedTask(task));

  if (loading) {
    return (
      <DevLayout>
        <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography color="text.secondary">Loading project workspace...</Typography>
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

  if (!activeProject || !activeProject.id || String(activeProject.id) !== String(id)) {
    return (
      <DevLayout>
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          Project not found for this developer.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Chip
            component={Link}
            to="/dev"
            clickable
            label="Back to dashboard"
            sx={{ bgcolor: "rgba(124,92,255,0.16)", color: "#e7e9ee", border: "1px solid rgba(124,92,255,0.25)" }}
          />
        </Box>
      </DevLayout>
    );
  }

  return (
    <DevLayout>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
              Project Workspace
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }} noWrap>
              {activeProject.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
              Project ID: <strong>{activeProject.id}</strong>
            </Typography>
          </Box>

          <Box sx={{ minWidth: 280 }}>
            <Card sx={{ p: 2.2 }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Project progress
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                {activeProject.progress}%
              </Typography>
              <ProgressBar value={activeProject.progress} />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
                <Chip size="small" label={`Tasks: ${visibleTasks.length}`} sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#e7e9ee" }} />
                <Chip size="small" label={`Open: ${openTasks.length}`} sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#e7e9ee" }} />
              </Box>
            </Card>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 0.9fr" }, gap: 3 }}>
        <Card sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
                Assigned work
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.3 }}>
                Tasks from backend
              </Typography>
            </Box>

            <Chip
              component={Link}
              to={`/dev/chat/${activeProject.id}`}
              clickable
              label="Open project chat"
              sx={{ bgcolor: "rgba(124,92,255,0.16)", color: "#e7e9ee", border: "1px solid rgba(124,92,255,0.25)" }}
            />
          </Box>

          <Stack spacing={1.5}>
            {visibleTasks.map((task) => (
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
                      {task.id} • {task.status} • Due {task.dueDate}
                    </Typography>
                    {task.description ? (
                      <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.78)", mt: 1 }}>
                        {task.description}
                      </Typography>
                    ) : null}
                  </Box>

                  <Chip size="small" label={task.priority} sx={{ bgcolor: "rgba(124,92,255,0.16)", color: "#e7e9ee" }} />
                </Box>
              </Box>
            ))}

            {visibleTasks.length === 0 ? (
              <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>
                No tasks found for this project.
              </Typography>
            ) : null}
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
            Project summary
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, letterSpacing: -0.3 }}>
            Backend view
          </Typography>

          <Stack spacing={1.4}>
            <Box sx={{ p: 1.8, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Total tasks
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {visibleTasks.length}
              </Typography>
            </Box>

            <Box sx={{ p: 1.8, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Open tasks
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {openTasks.length}
              </Typography>
            </Box>

            <Box sx={{ p: 1.8, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Completed tasks
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {visibleTasks.length - openTasks.length}
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Box>
    </DevLayout>
  );
}
