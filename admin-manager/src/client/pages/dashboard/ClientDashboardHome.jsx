import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Link } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import {
  fetchClientProjects,
  fetchClientSummary,
  fetchClientTickets,
} from "../../services/clientService";
import useLiveRefresh from "../../../hooks/useLiveRefresh";

export default function ClientDashboardHome() {
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryData, ticketData, projectData] = await Promise.all([
        fetchClientSummary(),
        fetchClientTickets(),
        fetchClientProjects(),
      ]);

      setSummary(summaryData);
      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setProjects(Array.isArray(projectData) ? projectData : []);
    } catch (err) {
      setError(err?.message || "Failed to load client dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const liveTopics = useMemo(
    () => ["/topic/client.dashboard", "/topic/tickets", "/topic/tasks"],
    []
  );

  useLiveRefresh(liveTopics, load, { debounceMs: 500 });

  const stats = useMemo(() => {
    return [
      {
        title: "Open Tickets",
        value: tickets.filter((ticket) => ticket.status === "Open").length,
      },
      {
        title: "In Progress",
        value: tickets.filter((ticket) => ticket.status === "In Progress").length,
      },
      {
        title: "Resolved",
        value: tickets.filter((ticket) => ticket.status === "Done").length,
      },
      {
        title: "Workstreams",
        value: projects.length,
      },
    ];
  }, [tickets, projects]);

  const recentTickets = tickets.slice(0, 5);
  const activeProject = projects[0] || null;

  return (
    <ClientLayout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Simple overview of your tickets and workstreams.
          </Typography>
        </Box>

        {error ? <Alert severity="warning">{error}</Alert> : null}

        {loading || !summary ? (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 260 }}>
            <CircularProgress sx={{ color: "#6d5dfc" }} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                gap: 2,
              }}
            >
              {stats.map((stat) => (
                <StatCard key={stat.title} title={stat.title} value={stat.value} />
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1.3fr 0.7fr" },
                gap: 2,
              }}
            >
              <Panel title="Recent Tickets" actionText="View all" actionTo="/client/tickets">
                {recentTickets.length === 0 ? (
                  <EmptyText>No tickets found.</EmptyText>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Box sx={{ minWidth: 650 }}>
                      <TableHeader columns="1.4fr 1fr 1fr 0.8fr" />

                      {recentTickets.map((ticket) => (
                        <Box
                          key={ticket.id}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr",
                            gap: 1.5,
                            alignItems: "center",
                            py: 1.4,
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                            {ticket.title}
                          </Typography>

                          <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                            {ticket.category || "-"}
                          </Typography>

                          <StatusChip status={ticket.status} />

                          <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                            {ticket.updatedAt}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Panel>

              <Panel title="Current Workstream">
                {!activeProject ? (
                  <EmptyText>No workstreams yet.</EmptyText>
                ) : (
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                      {activeProject.name}
                    </Typography>

                    <Typography sx={{ color: "#94a3b8", fontSize: 13, mt: 0.5 }}>
                      Status: {activeProject.status}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.8,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          Progress
                        </Typography>

                        <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                          {activeProject.progress}%
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={activeProject.progress}
                        sx={{
                          height: 7,
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.08)",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: "#6d5dfc",
                          },
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Panel>
            </Box>
          </>
        )}
      </Stack>
    </ClientLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "#0b1628",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "none",
      }}
    >
      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
        {title}
      </Typography>

      <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.8, color: "#f8fafc" }}>
        {value}
      </Typography>
    </Paper>
  );
}

function Panel({ title, children, actionText, actionTo }) {
  return (
    <Paper
      sx={{
        p: 2.2,
        borderRadius: 3,
        bgcolor: "#0b1628",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 900 }}>{title}</Typography>

        {actionText && actionTo ? (
          <Button
            component={Link}
            to={actionTo}
            size="small"
            sx={{ textTransform: "none", color: "#a5b4fc", fontWeight: 800 }}
          >
            {actionText}
          </Button>
        ) : null}
      </Box>

      {children}
    </Paper>
  );
}

function TableHeader({ columns }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: 1.5,
        pb: 1,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {["Title", "Category", "Status", "Updated"].map((heading) => (
        <Typography
          key={heading}
          variant="caption"
          sx={{
            color: "#64748b",
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {heading}
        </Typography>
      ))}
    </Box>
  );
}

function StatusChip({ status }) {
  const color =
    status === "Done"
      ? "rgba(34,197,94,0.15)"
      : status === "In Progress"
        ? "rgba(245,158,11,0.15)"
        : "rgba(124,92,255,0.16)";

  return (
    <Chip
      size="small"
      label={status}
      sx={{
        bgcolor: color,
        color: "#e5e7eb",
        border: "1px solid rgba(255,255,255,0.08)",
        fontWeight: 700,
        width: "fit-content",
      }}
    />
  );
}

function EmptyText({ children }) {
  return (
    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
      {children}
    </Typography>
  );
}
