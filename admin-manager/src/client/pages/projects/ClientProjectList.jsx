import React, { useEffect, useState } from "react";
import { Alert, Box, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import ClientLayout from "../../components/layout/ClientLayout";
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
    <ClientLayout>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: -0.4 }}>
          Client Workstreams
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)" }}>
          Workstreams are grouped from your live support tickets.
        </Typography>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert> : null}

      {loading ? null : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
        {projects.map((p) => (
          <Paper
            key={p.id}
            sx={{
              background: "rgba(15,20,40,0.6)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
              p: 2.25,
              borderRadius: "18px",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "rgba(15,20,40,0.8)",
                borderColor: "rgba(104,81,255,0.3)",
              },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {p.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                  Manager: {p.manager}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.48)", display: "block", mt: 0.5 }}>
                  {p.tickets?.length || 0} live tickets
                </Typography>
              </Box>
              <Chip label={p.status} size="small" sx={{ bgcolor: "rgba(104,81,255,0.2)", color: "#e7e9ee" }} />
            </Box>

            <Box>
              <LinearProgress
                variant="determinate"
                value={p.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.1)",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(59,130,246,0.95))",
                  },
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", mt: 1, display: "block" }}>
              {p.progress}% complete • ETA {p.eta}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
              <Chip size="small" label={`Done ${p.progress}%`} sx={{ bgcolor: "rgba(16,185,129,0.14)", color: "#e7e9ee" }} />
              <Chip size="small" label={p.tickets?.length || 0 ? `${p.tickets.length} tickets` : "No tickets"} sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#e7e9ee" }} />
            </Stack>
          </Paper>
        ))}
      </Box>
    </ClientLayout>
  );
}
