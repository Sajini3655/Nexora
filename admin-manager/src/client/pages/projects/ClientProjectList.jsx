import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, LinearProgress, Chip } from "@mui/material";
import ClientLayout from "../../components/layout/ClientLayout";
import { fetchClientProjects } from "../../services/clientService";

export default function ClientProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchClientProjects().then(setProjects);
  }, []);

  return (
    <ClientLayout>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Client Projects
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {projects.map((p) => (
          <Paper
            key={p.id}
            sx={{
              background: "rgba(15,20,40,0.6)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
              p: 2,
              borderRadius: "16px",
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
          </Paper>
        ))}
      </Box>
    </ClientLayout>
  );
}
