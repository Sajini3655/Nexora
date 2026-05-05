import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import { useClientProjects, useClientTickets } from "../../services/useClient";

function getDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SummaryRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.8 }}>
      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color: "#ffffff" }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function ClientProjectDetails() {
  const { projectId } = useParams();
  const {
    data: projects = [],
    isLoading: projectsLoading,
  } = useClientProjects();
  const {
    data: tickets = [],
    isLoading: loading,
    error: queryError,
  } = useClientTickets();

  const project = useMemo(
    () => projects.find((item) => String(item.id) === String(projectId)),
    [projects, projectId]
  );

  const projectTickets = useMemo(
    () => tickets.filter((ticket) => String(ticket.projectId ?? "") === String(project?.id ?? projectId)),
    [tickets, project?.id, projectId]
  );
  const openCount = projectTickets.filter((ticket) => ticket.status === "Open").length;
  const inProgressCount = projectTickets.filter((ticket) => ticket.status === "In Progress").length;
  const resolvedCount = projectTickets.filter((ticket) => ticket.status === "Done").length;
  const lastUpdated = useMemo(() => {
    if (!projectTickets.length) return "-";
    const sorted = [...projectTickets].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    return getDateLabel(sorted[0]?.updatedAt || sorted[0]?.createdAt);
  }, [projectTickets]);

  const recentTickets = useMemo(() => projectTickets.slice(0, 5), [projectTickets]);

  if (loading || projectsLoading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
        <CircularProgress sx={{ color: "#6d5dfc" }} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: "#0b1628",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "none",
        }}
      >
        {queryError ? <Alert severity="warning" sx={{ mb: 3 }}>{queryError.message || queryError}</Alert> : null}
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          Project not found
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
          The project you are looking for does not exist or is not assigned to your account.
        </Typography>
        <Button
          component={Link}
          to="/client/projects"
          variant="outlined"
          sx={{ textTransform: "none", borderColor: "rgba(255,255,255,0.14)", color: "#cbd5e1" }}
        >
          Back to projects
        </Button>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: 1 }}>
            Project details
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
            {project.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1, maxWidth: 680 }}>
            A client-facing project assigned to your account. Track progress, recent requests, and status for the current project.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <StatusBadge label={project.status} size="medium" />
          <Button
            component={Link}
            to="/client/projects"
            variant="outlined"
            sx={{ textTransform: "none", borderColor: "rgba(255,255,255,0.14)", color: "#cbd5e1" }}
          >
            Back to projects
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Paper
            sx={{
              p: 2.25,
              borderRadius: 3,
              bgcolor: "#0b1628",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "none",
              height: "100%",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              Overview
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
              This project is updated automatically from your client support requests. Review latest activity, status, and request details below.
            </Typography>

            <SummaryRow label="Project" value={project.name} />
            <SummaryRow label="Status" value={project.status} />
            <SummaryRow label="Requests" value={`${projectTickets.length}`} />
            <SummaryRow label="Updated" value={lastUpdated} />
            <SummaryRow label="Manager" value={project.manager || "Client Support"} />

            <Box sx={{ mt: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Overall progress
                </Typography>
                <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                  {project.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={project.progress}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  bgcolor: "rgba(255,255,255,0.08)",
                  "& .MuiLinearProgress-bar": { bgcolor: "#6d5dfc" },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper
            sx={{
              p: 2.25,
              borderRadius: 3,
              bgcolor: "#0b1628",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "none",
              height: "100%",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              Request status
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
              See how the active requests for this project are distributed by status.
            </Typography>

            <Box sx={{ display: "grid", gap: 1.25 }}>
              <Paper
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: "#0f1b2f",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Open requests
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mt: 0.5 }}>{openCount}</Typography>
              </Paper>

              <Paper
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: "#0f1b2f",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  In progress
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mt: 0.5 }}>{inProgressCount}</Typography>
              </Paper>

              <Paper
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: "#0f1b2f",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Resolved
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mt: 0.5 }}>{resolvedCount}</Typography>
              </Paper>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Paper
            sx={{
              p: 2.25,
              borderRadius: 3,
              bgcolor: "#0b1628",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "none",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              Recent tickets
            </Typography>

            {projectTickets.length === 0 ? (
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                No tickets for this project yet.
              </Typography>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: 640 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2.5fr 1fr 1fr 1fr",
                      gap: 1.5,
                      pb: 1,
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {[
                      "Title",
                      "Status",
                      "Priority",
                      "Updated",
                    ].map((header) => (
                      <Typography
                        key={header}
                        variant="caption"
                        sx={{ color: "#64748b", fontWeight: 900, textTransform: "uppercase" }}
                      >
                        {header}
                      </Typography>
                    ))}
                  </Box>

                  {recentTickets.map((ticket) => (
                    <Box
                      key={ticket.id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2.5fr 1fr 1fr 1fr",
                        gap: 1.5,
                        alignItems: "center",
                        py: 1.5,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{ticket.title}</Typography>
                      <StatusBadge label={ticket.status} />
                      <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>{ticket.priority || "Medium"}</Typography>
                      <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>{getDateLabel(ticket.updatedAt)}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper
            sx={{
              p: 2.25,
              borderRadius: 3,
              bgcolor: "#0b1628",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "none",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              Project summary
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
              {project.description || `${projectTickets.length} support request${projectTickets.length === 1 ? "" : "s"} currently grouped into this project.`}
            </Typography>
            <Stack spacing={1.25}>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8 }}>
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>Open requests</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{openCount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8 }}>
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>In progress</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{inProgressCount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8 }}>
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>Resolved</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{resolvedCount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8 }}>
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>Last updated</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{lastUpdated}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
