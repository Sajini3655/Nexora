import React, { useMemo } from "react";
import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

const surfaceSx = {
  p: 2.2,
  borderRadius: "22px",
  bgcolor: "var(--nx-panel)",
  border: "1px solid var(--nx-border)",
  boxShadow: "none",
};

const innerSurfaceSx = {
  p: 1.4,
  borderRadius: 2,
  bgcolor: "var(--nx-panel-2)",
  border: "1px solid var(--nx-border)",
};

export default function ClientProjectTimeline({ project, tickets = [] }) {
  const timeline = useMemo(() => {
    const projectTickets = project?.tickets?.length ? project.tickets : tickets;
    const total = projectTickets.length;
    const open = projectTickets.filter((ticket) => ticket.status === "Open").length;
    const inProgress = projectTickets.filter((ticket) => ticket.status === "In Progress").length;
    const done = projectTickets.filter((ticket) => ticket.status === "Done").length;

    return [
      {
        title: "Request received",
        description:
          total > 0
            ? `${total} client request${total === 1 ? "" : "s"} captured in this project.`
            : "No client requests have been added yet.",
        status: total > 0 ? "Completed" : "Pending",
      },
      {
        title: "Review and planning",
        description:
          total > 0
            ? "The team has reviewed the request and grouped it into this project."
            : "Planning will start after a request is created.",
        status: total > 0 ? "Completed" : "Pending",
      },
      {
        title: "Development in progress",
        description:
          inProgress > 0
            ? `${inProgress} ticket${inProgress === 1 ? "" : "s"} currently in progress.`
            : open > 0
              ? `${open} ticket${open === 1 ? "" : "s"} waiting to be started.`
              : "No active development tickets right now.",
        status: inProgress > 0 ? "In Progress" : open > 0 ? "Pending" : done > 0 ? "Completed" : "Pending",
      },
      {
        title: "Client review",
        description:
          done > 0
            ? `${done} ticket${done === 1 ? "" : "s"} ready or completed for review.`
            : "Completed work will appear here for client review.",
        status: done > 0 ? "In Progress" : "Pending",
      },
      {
        title: "Resolved",
        description:
          total > 0 && done === total
            ? "All tickets in this project are resolved."
            : "This milestone completes when all related tickets are resolved.",
        status: total > 0 && done === total ? "Completed" : "Pending",
      },
    ];
  }, [project, tickets]);

  if (!project && tickets.length === 0) {
    return (
      <Paper sx={surfaceSx}>
        <Typography sx={{ fontWeight: 900, fontSize: 17, color: "var(--nx-text)" }}>
          Project Timeline
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 1 }}>
          No project timeline available yet. Create a ticket to start tracking client progress.
        </Typography>
      </Paper>
    );
  }

  if (project && tickets.length === 0) {
    return (
      <Paper sx={surfaceSx}>
        <Typography sx={{ fontWeight: 900, fontSize: 17, color: "var(--nx-text)" }}>
          Project Timeline
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 1 }}>
          No tickets for this project yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={surfaceSx}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 17, color: "var(--nx-text)" }}>
            Project Timeline
          </Typography>
        </Box>

        <Chip
          label={`${project?.progress ?? 0}% complete`}
          size="small"
          sx={{
            color: "var(--nx-purple)",
            bgcolor: "var(--nx-panel-2)",
            border: "1px solid var(--nx-border)",
            fontWeight: 800,
          }}
        />
      </Box>

      <LinearProgress
        variant="determinate"
        value={project?.progress ?? 0}
        sx={{
          height: 7,
          borderRadius: 999,
          mb: 2.5,
          bgcolor: "var(--nx-panel-2)",
          "& .MuiLinearProgress-bar": {
            bgcolor: "var(--nx-purple)",
          },
        }}
      />

      <Stack spacing={1.4}>
        {timeline.map((item, index) => (
          <Box key={item.title} sx={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 1.5, alignItems: "flex-start" }}>
            <Box sx={{ display: "grid", justifyItems: "center" }}>
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  mt: 0.4,
                  bgcolor:
                    item.status === "Completed"
                      ? "#22c55e"
                      : item.status === "In Progress"
                        ? "#f59e0b"
                        : "var(--nx-muted)",
                  boxShadow:
                    item.status === "In Progress"
                      ? "0 0 0 5px rgba(245,158,11,0.12)"
                      : "none",
                }}
              />

              {index < timeline.length - 1 ? (
                <Box sx={{ width: 2, height: 42, bgcolor: "var(--nx-border)", mt: 0.8 }} />
              ) : null}
            </Box>

            <Box sx={innerSurfaceSx}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                <Typography sx={{ fontWeight: 850, fontSize: 15, color: "var(--nx-text)" }}>
                  {item.title}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color:
                      item.status === "Completed"
                        ? "#86efac"
                        : item.status === "In Progress"
                          ? "#facc15"
                          : "var(--nx-muted)",
                    fontWeight: 800,
                  }}
                >
                  {item.status}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 0.5 }}>
                {item.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
