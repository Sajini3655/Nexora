import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import StatusBadge from "../../../components/ui/StatusBadge";
import { fetchClientProjects } from "../../services/clientService";

export default function ClientProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const rows = await fetchClientProjects();
        if (!active) return;
        setProjects(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load workstreams.");
        setProjects([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Workstreams
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Workstreams are grouped from your live support tickets.
          </Typography>
        </Box>

        {error ? <Alert severity="warning">{error}</Alert> : null}

        <Paper
          sx={{
            p: 2.2,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
          }}
        >
          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 150 }}>
              <CircularProgress sx={{ color: "#6d5dfc" }} />
            </Box>
          ) : projects.length === 0 ? (
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              No workstreams found.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {projects.map((project) => (
                <Box
                  key={project.id}
                  sx={{
                    p: 1.8,
                    borderRadius: 2,
                    bgcolor: "#0f1b2f",
                    border: "1px solid rgba(255,255,255,0.07)",
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
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
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
                      bgcolor: "rgba(255,255,255,0.08)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#6d5dfc",
                      },
                    }}
                  />

                  <Typography variant="caption" sx={{ color: "#94a3b8", mt: 1, display: "block" }}>
                    {project.progress}% complete • Last update {project.eta}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </>
  );
}


