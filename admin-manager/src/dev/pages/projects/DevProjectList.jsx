import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Grid, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";

function buildProjects(tasks) {
  const groups = new Map();

  tasks.forEach((task) => {
    const key = String(task.projectId || task.projectName || "project-unknown");
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(task);
  });

  return [...groups.entries()].map(([key, list]) => {
    const total = list.length;
    const done = list.filter((task) => String(task.status).toLowerCase() === "completed" || String(task.status).toLowerCase() === "done").length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    return {
      id: String(list[0]?.projectId || key),
      name: list[0]?.projectName || `Project ${key}`,
      manager: "Backend",
      progress,
      taskCount: total,
      status: progress === 100 ? "Completed" : progress > 0 ? "Active" : "Planning",
      description: list[0]?.description || "Backend-derived project grouped from assigned tasks.",
    };
  });
}

export default function DevProjectList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(() => loadTasks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const synced = await syncAssignedTasksToLocalStoreSafe();
        if (!active) return;
        setTasks(Array.isArray(synced) ? synced : loadTasks());
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load projects.");
        setTasks(loadTasks());
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const projects = useMemo(() => buildProjects(tasks), [tasks]);
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((project) => `${project.name} ${project.manager} ${project.id}`.toLowerCase().includes(q));
  }, [projects, search]);

  return (
    <DevLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>
          Projects
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)", mt: 0.5 }}>
          Projects are grouped from backend tasks assigned to you.
        </Typography>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <TextField
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search projects or ids..."
        sx={{ mb: 3 }}
        InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.7 }} /> }}
      />

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress sx={{ color: "#6b51ff" }} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card sx={{ p: 2.5, height: "100%", cursor: "pointer", transition: "transform 180ms ease", "&:hover": { transform: "translateY(-2px)" } }} onClick={() => navigate(`/dev/projects/${project.id}`)}>
                <Chip label={project.status} size="small" sx={{ mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.3 }}>
                  {project.name}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: "rgba(231,233,238,0.76)" }}>
                  {project.description}
                </Typography>
                <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="caption">Tasks: {project.taskCount}</Typography>
                  <Typography variant="caption">Progress: {project.progress}%</Typography>
                </Box>
              </Card>
            </Grid>
          ))}

          {filteredProjects.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1">No backend projects found.</Typography>
              </Card>
            </Grid>
          ) : null}
        </Grid>
      )}
    </DevLayout>
  );
}