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
      <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--nx-text)" }}>
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
        <CircularProgress sx={{ color: "var(--nx-purple)" }} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: "var(--nx-panel)",
          border: "1px solid var(--nx-border)",
          boxShadow: "none",
        }}
      >
        {queryError ? <Alert severity="warning" sx={{ mb: 3 }}>{queryError.message || queryError}</Alert> : null}
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          Project not found
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--nx-muted)", mb: 2 }}>
          The project you are looking for does not exist or is not assigned to your account.
        </Typography>
        <Button
          component={Link}
          to="/client/projects"
          variant="outlined"
          sx={{ textTransform: "none", borderColor: "var(--nx-border)", color: "var(--nx-text-soft)" }}
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
          <Typography variant="overline" sx={{ color: "var(--nx-muted)", letterSpacing: 1 }}>
            Project details
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
            {project.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 1, maxWidth: 680 }}>
            A client-facing project assigned to your account. Track progress, recent requests, and status for the current project.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <StatusBadge label={project.status} size="medium" />
          <Button
            component={Link}
            to="/client/projects"
            variant="outlined"
            sx={{ textTransform: "none", borderColor: "var(--nx-border)", color: "var(--nx-text-soft)" }}
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
              bgcolor: "var(--nx-panel)",
              border: "1px solid var(--nx-border)",
              boxShadow: "none",
              height: "100%",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              Overview
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--nx-muted)", mb: 3 }}>
              This project is updated automatically from your client support requests. Review latest activity, status, and request details below.
            </Typography>

            <SummaryRow label="Project" value={project.name} />
            <SummaryRow label="Status" value={project.status} />
            <SummaryRow label="Requests" value={`${projectTickets.length}`} />
            <SummaryRow label="Updated" value={lastUpdated} />
            <SummaryRow label="Manager" value={project.manager || "Client Support"} />

            <Box sx={{ mt: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                  Overall progress
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--nx-text-soft)" }}>
                  {project.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={project.progress}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  bgcolor: "color-mix(in srgb, var(--nx-border) 80%, transparent)",
                  "& .MuiLinearProgress-bar": { bgcolor: "var(--nx-purple)" },
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
              bgcolor: "var(--nx-panel)",
              border: "1px solid var(--nx-border)",
              boxShadow: "none",
              height: "100%",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              Request status
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--nx-muted)", mb: 3 }}>
              See how the active requests for this project are distributed by status.
            </Typography>

            <Box sx={{ display: "grid", gap: 1.25 }}>
              <Paper
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: "var(--nx-panel-2)",
                  border: "1px solid var(--nx-border)",
                }}
              >
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                  Open requests
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mt: 0.5 }}>{openCount}</Typography>
              </Paper>

              <Paper
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: "var(--nx-panel-2)",
                  border: "1px solid var(--nx-border)",
                }}
              >
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                  In progress
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mt: 0.5 }}>{inProgressCount}</Typography>
              </Paper>

              <Paper
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: "var(--nx-panel-2)",
                  border: "1px solid var(--nx-border)",
                }}
              >
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
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
              bgcolor: "var(--nx-panel)",
              border: "1px solid var(--nx-border)",
              boxShadow: "none",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              Recent tickets
            </Typography>

            {projectTickets.length === 0 ? (
              <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
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
                      borderBottom: "1px solid var(--nx-border)",
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
                        sx={{ color: "var(--nx-muted)", fontWeight: 900, textTransform: "uppercase" }}
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
                        borderBottom: "1px solid color-mix(in srgb, var(--nx-border) 70%, transparent)",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{ticket.title}</Typography>
                      <StatusBadge label={ticket.status} />
                      <Typography sx={{ color: "var(--nx-muted)", fontSize: 14 }}>{ticket.priority || "Medium"}</Typography>
                      <Typography sx={{ color: "var(--nx-muted)", fontSize: 14 }}>{getDateLabel(ticket.updatedAt)}</Typography>
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
              bgcolor: "var(--nx-panel)",
              border: "1px solid var(--nx-border)",
              boxShadow: "none",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              Project summary
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--nx-muted)", mb: 2 }}>
              {project.description || `${projectTickets.length} support request${projectTickets.length === 1 ? "" : "s"} currently grouped into this project.`}
            </Typography>
            <Stack spacing={1.25}>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8 }}>
                <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>Open requests</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{openCount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8 }}>
                <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>In progress</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{inProgressCount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8 }}>
                <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>Resolved</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{resolvedCount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8 }}>
                <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>Last updated</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{lastUpdated}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
