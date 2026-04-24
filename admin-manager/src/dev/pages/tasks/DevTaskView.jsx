import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import { fetchDeveloperTaskById } from "../../services/developerApi";

export default function DevTaskView() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchDeveloperTaskById(id);
        if (!active) return;
        setTask(data);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load task details.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <DevLayout>
        <Box sx={{ minHeight: "45vh", display: "grid", placeItems: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography color="text.secondary">Loading task...</Typography>
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

  if (!task) {
    return (
      <DevLayout>
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          Task not found.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Link to="/dev/tasks" style={{ color: "#c4b5fd", fontWeight: 700 }}>
            Back to tasks
          </Link>
        </Box>
      </DevLayout>
    );
  }

  return (
    <DevLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
            Task details
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }} noWrap>
            {task.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
            {task.id} • Project {task.projectName || task.projectId || "-"}
          </Typography>
        </Box>

        <Link to={`/dev/project/${task.projectId}`} style={{ color: "#c4b5fd", fontWeight: 700 }}>
          Back to project
        </Link>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 0.8fr" }, gap: 3 }}>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
            Description
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5, color: "rgba(231,233,238,0.88)" }}>
            {task.description || "No description provided."}
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
            Metadata
          </Typography>

          <Stack spacing={1.4} sx={{ mt: 1.5 }}>
            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Status
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>{task.status}</Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Priority
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>{task.priority}</Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,238,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Assigned to
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>{task.assignedToName || "You"}</Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Due date
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>{task.dueDate}</Typography>
            </Box>
          </Stack>
        </Card>
      </Box>
    </DevLayout>
  );
}
