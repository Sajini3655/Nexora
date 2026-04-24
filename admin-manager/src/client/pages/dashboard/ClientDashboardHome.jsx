import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import ClientLayout from "../../components/layout/ClientLayout";
import { fetchClientSummary } from "../../services/clientService";

export default function ClientDashboardHome() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchClientSummary().then(setSummary);
  }, []);

  return (
    <ClientLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Client Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
          Track project progress, ticket activity, and next delivery milestones.
        </Typography>
      </Box>

      {!summary ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <CircularProgress sx={{ color: "#6b51ff" }} />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2 }}>
          <Stat title="Active Projects" value={summary.activeProjects} />
          <Stat title="Open Tickets" value={summary.openTickets} />
          <Stat title="Completed Milestones" value={summary.completedMilestones} />
          <Stat title="Next Review" value={summary.nextReview} />
        </Box>
      )}
    </ClientLayout>
  );
}

function Stat({ title, value }) {
  return (
    <Paper
      sx={{
        background: "rgba(15,20,40,0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.08)",
        p: 2,
        borderRadius: "16px",
        "&:hover": {
          background: "rgba(15,20,40,0.8)",
          borderColor: "rgba(104,81,255,0.3)",
        },
        transition: "all 0.3s ease",
      }}
    >
      <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.5)" }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ mt: 1, fontWeight: 700, color: "#e7e9ee" }}>
        {value}
      </Typography>
    </Paper>
  );
}
