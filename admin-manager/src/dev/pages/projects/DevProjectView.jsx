import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Grid, Typography } from "@mui/material";
import Card from "../../../components/ui/Card.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";

function buildProjects(tasks) {
  const groups = new Map();
  tasks.forEach((task) => {
    const key = String(task.projectId || task.projectName || "project-unknown");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  });
  return [...groups.entries()].map(([key, list]) => {
    const total = list.length;
    const done = list.filter((task) => String(task.status).toLowerCase() === "completed" || String(task.status).toLowerCase() === "done").length;
    const totalPointValue = list.reduce((sum, task) => sum + Number(task.totalPointValue || 0), 0);
    const completedPointValue = list.reduce((sum, task) => sum + Number(task.completedPointValue || 0), 0);
    const progress = totalPointValue > 0 ? Math.round((completedPointValue * 100) / totalPointValue) : (total === 0 ? 0 : Math.round((done / total) * 100));
    return {
      id: String(list[0]?.projectId || key),
      name: list[0]?.projectName || `Project ${key}`,
      progress,
      taskCount: total,
      status: progress === 100 ? "Completed" : progress > 0 ? "Active" : "Planning",
      tasks: list,
    };
  });
}

export default function DevProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(() => loadTasks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError(err?.message || "Failed to load project.");
        setTasks(loadTasks());
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  const project = useMemo(() => buildProjects(tasks).find((item) => String(item.id) === String(id)) || null, [tasks, id]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress sx={{ color: "#6b51ff" }} />
      </Box>
    );
  }

  if (!project) {
    return (
      <>
        {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Project not found</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(231,233,238,0.72)" }}>
            No assigned project matches <strong>{id}</strong>.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip component={Link} clickable to="/dev/projects" label="Back to projects" />
          </Box>
        </Card>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)" }}>Assigned Project</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>{project.name}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(231,233,238,0.72)" }}>
            {project.taskCount} tasks • {project.progress}% complete
          </Typography>
        </Box>

        <Chip component={Link} clickable to="/dev/projects" label="Back" />
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Project Overview</Typography>
            <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.76)" }}>
              This project contains tasks assigned to your developer account.
            </Typography>
            <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              <Metric label="Status" value={project.status} />
              <Metric label="Tasks" value={project.taskCount} />
              <Metric label="Progress" value={`${project.progress}%`} />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Tasks in project</Typography>
            <Box sx={{ display: "grid", gap: 1.25 }}>
              {project.tasks.map((task) => (
                <Box key={task.id} sx={{ p: 1.5, borderRadius: 2, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }} onClick={() => navigate(`/dev/tasks/${task.id}`)}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{task.title}</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>{task.status} • {task.priority || "Medium"}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>{label}</Typography>
      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 800 }}>{value}</Typography>
    </Box>
  );
}




