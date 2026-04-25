import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import Card from "../../../components/ui/Card.jsx";
import {
  fetchClientProfile,
  fetchClientProjects,
  fetchClientSummary,
  fetchClientTickets,
} from "../../services/clientService";

export default function ClientDashboardHome() {
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [summaryData, profileData, ticketData, projectData] = await Promise.all([
          fetchClientSummary(),
          fetchClientProfile(),
          fetchClientTickets(),
          fetchClientProjects(),
        ]);

        if (!active) return;

        setSummary(summaryData);
        setProfile(profileData);
        setTickets(Array.isArray(ticketData) ? ticketData : []);
        setProjects(Array.isArray(projectData) ? projectData : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load client dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === "Open").length;
    const inProgress = tickets.filter((ticket) => ticket.status === "In Progress").length;
    const done = tickets.filter((ticket) => ticket.status === "Done").length;

    return [
      { title: "Open Tickets", value: open },
      { title: "In Progress", value: inProgress },
      { title: "Resolved", value: done },
      { title: "Workstreams", value: projects.length },
    ];
  }, [projects.length, tickets]);

  const topProject = projects[0] || null;
  const completion = topProject?.progress ?? 0;
  const recentTickets = tickets.slice(0, 4);

  return (
    <ClientLayout>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: -0.4 }}>
            Client Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)" }}>
            Live support overview powered by your backend tickets and account data.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label={profile?.name ? `Signed in as ${profile.name}` : "Client Session"}
            size="small"
            sx={{ bgcolor: "rgba(124,92,255,0.16)", color: "#e7e9ee", border: "1px solid rgba(124,92,255,0.25)", fontWeight: 900 }}
          />
          <Chip
            label={summary ? `${summary.openTickets ?? 0} open tickets` : "Loading live data"}
            size="small"
            sx={{ bgcolor: "rgba(16,185,129,0.16)", color: "#e7e9ee", border: "1px solid rgba(16,185,129,0.25)", fontWeight: 900 }}
          />
        </Stack>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      {loading || !summary ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <CircularProgress sx={{ color: "#6b51ff" }} />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.15fr 0.85fr" }, gap: 2.5 }}>
          <Box sx={{ display: "grid", gap: 2.5 }}>
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Current workstream</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: -0.6 }}>
                    {topProject?.name || "No workstreams yet"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.75 }}>
                    {topProject ? `Status: ${topProject.status} • Updated ${topProject.eta}` : "Create a ticket to begin tracking your support activity."}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Progress</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.25 }}>{completion}%</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={completion}
                  sx={{ height: 8, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, rgba(124,92,255,0.95), rgba(34,197,94,0.95))" } }}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 2, flexWrap: "wrap" }}>
                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                  {summary.activeProjects} active workstreams • {summary.completedMilestones} resolved tickets • {summary.openTickets} open tickets
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                  Next review: {summary.nextReview}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", mt: 2.5 }}>
                <Button component={Link} to="/client/tickets" variant="contained" sx={{ borderRadius: 999, fontWeight: 800 }}>
                  Open tickets
                </Button>
                <Button component={Link} to="/client/projects" variant="outlined" sx={{ borderRadius: 999, fontWeight: 800, color: "#e7e9ee", borderColor: "rgba(255,255,255,0.16)" }}>
                  View workstreams
                </Button>
              </Box>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              {stats.map((stat) => (
                <Stat key={stat.title} title={stat.title} value={stat.value} />
              ))}
            </Box>

            <Card sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Recent tickets</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.25 }}>Live backend activity</Typography>
                </Box>
                <Button component={Link} to="/client/tickets" size="small" sx={{ textTransform: "none", fontWeight: 800, color: "#e7e9ee" }}>
                  View all
                </Button>
              </Box>

              <Box sx={{ display: "grid", gap: 1.25 }}>
                {recentTickets.length > 0 ? recentTickets.map((ticket) => (
                  <Box key={ticket.id} sx={{ p: 1.75, borderRadius: 2.5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{ticket.title}</Typography>
                        <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)", display: "block", mt: 0.25 }}>
                          {ticket.category} • Updated {ticket.updatedAt}
                        </Typography>
                      </Box>
                      <Chip size="small" label={ticket.status} sx={{ bgcolor: ticket.status === "Done" ? "rgba(16,185,129,0.16)" : ticket.status === "In Progress" ? "rgba(245,158,11,0.16)" : "rgba(124,92,255,0.16)", color: "#e7e9ee", fontWeight: 800 }} />
                    </Box>
                  </Box>
                )) : (
                  <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.66)" }}>
                    No tickets yet. Use the Tickets page to create your first support request.
                  </Typography>
                )}
              </Box>
            </Card>
          </Box>

          <Box sx={{ display: "grid", gap: 2.5 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Profile</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>{profile?.name || "Client User"}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
                {profile?.email || "-"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)", display: "block", mt: 1 }}>
                {profile?.company || "Client Account"}
              </Typography>

              <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

              <Stack spacing={1.5}>
                <Button component={Link} to="/client/tickets" variant="contained" sx={{ borderRadius: 999, fontWeight: 800 }}>
                  Create a ticket
                </Button>
                <Button component={Link} to="/client/projects" variant="outlined" sx={{ borderRadius: 999, fontWeight: 800, color: "#e7e9ee", borderColor: "rgba(255,255,255,0.16)" }}>
                  See workstreams
                </Button>
              </Stack>
            </Card>

            <Card sx={{ p: 3 }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Live snapshot</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>Backend data refreshed every 15s</Typography>
              <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 1 }}>
                All client information on this page comes from live API calls. No mock seed data is used.
              </Typography>
            </Card>
          </Box>
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
