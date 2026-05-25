import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import { useClientProjects } from "../../services/useClient";

export default function ClientProjectList() {
  const { data: projects = [], isLoading: loading, error: queryError } = useClientProjects();
  const error = queryError?.message || "";
  const location = useLocation();

  const q = React.useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return String(params.get("q") || "").trim().toLowerCase();
  }, [location.search]);

  const visibleProjects = React.useMemo(() => {
    if (!q) return projects;
    return projects.filter((project) => {
      const text = `${project?.name || ""} ${project?.manager || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [projects, q]);

  return (
    <>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Projects
          </Typography>
        </Box>

        {error ? <Alert severity="warning">{error}</Alert> : null}

        <Paper
          sx={{
            p: 2.2,
            borderRadius: 3,
            bgcolor: "var(--nx-panel)",
            border: "1px solid var(--nx-border)",
            boxShadow: "none",
          }}
        >
          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 150 }}>
              <CircularProgress sx={{ color: "var(--nx-purple)" }} />
            </Box>
          ) : projects.length === 0 ? (
            <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
              No projects assigned to your account yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {visibleProjects.map((project) => (
                <Box
                  key={project.id}
                  sx={{
                    p: 1.8,
                    borderRadius: 2,
                    bgcolor: "var(--nx-panel-2)",
                    border: "1px solid var(--nx-border)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                      mb: 1.5,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>
                        {project.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                        Manager: {project.manager} • {project.tickets?.length || 0} tickets
                      </Typography>
                    </Box>

                    <StatusBadge label={project.status} />
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={project.progress}
                    sx={{
                      height: 7,
                      borderRadius: 999,
                      bgcolor: "color-mix(in srgb, var(--nx-border) 80%, transparent)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "var(--nx-purple)",
                      },
                    }}
                  />

                  <Typography variant="caption" sx={{ color: "var(--nx-muted)", mt: 1, display: "block" }}>
                    {project.progress}% complete • Last update {project.eta}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                    <Button
                      component={Link}
                      to={`/client/projects/${project.id}`}
                      size="small"
                      variant="contained"
                      sx={{
                        textTransform: "none",
                        bgcolor: "var(--nx-purple)",
                        color: "#fff",
                        px: 1.8,
                        py: 0.9,
                        fontWeight: 700,
                        borderRadius: 2,
                        boxShadow: "none",
                        "&:hover": { bgcolor: "color-mix(in srgb, var(--nx-purple) 88%, #000 12%)" },
                      }}
                    >
                      View details
                    </Button>
                  </Box>
                </Box>
              ))}

              {q && visibleProjects.length === 0 ? (
                <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
                  No projects match “{q}”.
                </Typography>
              ) : null}
            </Stack>
          )}
        </Paper>
      </Stack>
    </>
  );
}


