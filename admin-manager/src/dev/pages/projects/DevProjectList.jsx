import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import { deriveSingleProject, fetchDeveloperTasks } from "../../services/developerApi";

export default function DevProjectList() {
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
        setError(err?.message || "Failed to load project list.");
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

  if (loading) {
    return (
      <DevLayout>
        <Box sx={{ minHeight: "45vh", display: "grid", placeItems: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography color="text.secondary">Loading projects...</Typography>
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
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, letterSpacing: -0.4 }}>
        My Project
      </Typography>

      {!project ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No backend project is assigned yet.
        </Alert>
      ) : (
        <Card sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Backend project
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.3 }} noWrap>
                {project.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
                Project ID: {project.id}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Box component={Link} to={`/dev/project/${project.id}`} sx={{ color: "#c4b5fd", fontWeight: 800 }}>
                Open workspace
              </Box>
              <Box component={Link} to={`/dev/chat/${project.id}`} sx={{ color: "#c4b5fd", fontWeight: 800 }}>
                Open chat
              </Box>
            </Stack>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
            <Box sx={{ px: 1.2, py: 0.6, borderRadius: 999, bgcolor: "rgba(124,92,255,0.16)", border: "1px solid rgba(124,92,255,0.25)" }}>
              Tasks: {project.totalTasks}
            </Box>
            <Box sx={{ px: 1.2, py: 0.6, borderRadius: 999, bgcolor: "rgba(124,92,255,0.16)", border: "1px solid rgba(124,92,255,0.25)" }}>
              Open: {project.openTasks}
            </Box>
            <Box sx={{ px: 1.2, py: 0.6, borderRadius: 999, bgcolor: "rgba(124,92,255,0.16)", border: "1px solid rgba(124,92,255,0.25)" }}>
              Progress: {project.progress}%
            </Box>
          </Box>
        </Card>
      )}
    </DevLayout>
  );
}
