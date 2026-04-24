import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import ClientLayout from "../../components/layout/ClientLayout";
import Card from "../../../components/ui/Card.jsx";
import { fetchClientSummary } from "../../services/clientService";

export default function ClientDashboardHome() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchClientSummary().then(setSummary);
  }, []);

  return (
    <ClientLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: -0.4 }}>
          Client Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)" }}>
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
    <Card
      sx={{
        p: 2.5,
        borderRadius: 4,
        transition: "transform 180ms ease, border-color 180ms ease, background 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(124,92,255,0.28)"
        }
      }}
    >
      <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(231,233,238,0.56)" }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ mt: 1, fontWeight: 900, color: "#e7e9ee", letterSpacing: -0.3 }}>
        {value}
      </Typography>
    </Card>
  );
}
