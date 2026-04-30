import React, { useMemo } from "react";
import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export default function ClientProjectTimeline({ project, tickets = [] }) {
  const timeline = useMemo(() => {
    const projectTickets = project?.tickets?.length ? project.tickets : tickets;
    const total = projectTickets.length;
    const open = projectTickets.filter((ticket) => ticket.status === "Open").length;
    const inProgress = projectTickets.filter((ticket) => ticket.status === "In Progress").length;
    const done = projectTickets.filter((ticket) => ticket.status === "Done").length;

    // These milestones are generated from live ticket progress.
    return [
      {
        title: "Request received",
        description:
          total > 0
            ? `${total} client request${total === 1 ? "" : "s"} captured in this workstream.`
            : "No client requests have been added yet.",
        status: total > 0 ? "Completed" : "Pending",
      },
      {
        title: "Review and planning",
        description:
          total > 0
            ? "The team has reviewed the request and grouped it into a workstream."
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
            ? "All tickets in this workstream are resolved."
            : "This milestone completes when all related tickets are resolved.",
        status: total > 0 && done === total ? "Completed" : "Pending",
      },
    ];
  }, [project, tickets]);

  if (!project && tickets.length === 0) {
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
        <Typography sx={{ fontWeight: 900, fontSize: 17 }}>
          Project Timeline
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>
          No project timeline available yet. Create a ticket to start tracking client progress.
        </Typography>
      </Paper>
    );
  }

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
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 17 }}>
            Project Timeline
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.4 }}>
            Client-friendly milestone view for {project?.name || "your current workstream"}.
          </Typography>
        </Box>

        <Chip
          label={`${project?.progress ?? 0}% complete`}
          size="small"
          sx={{
            color: "#c4b5fd",
            bgcolor: "rgba(109,93,252,0.14)",
            border: "1px solid rgba(165,180,252,0.18)",
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
          bgcolor: "rgba(255,255,255,0.08)",
          "& .MuiLinearProgress-bar": {
            bgcolor: "#6d5dfc",
          },
        }}
      />

      <Stack spacing={1.4}>
        {timeline.map((item, index) => (
          <Box
            key={item.title}
            sx={{
              display: "grid",
              gridTemplateColumns: "28px 1fr",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
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
                        : "#475569",
                  boxShadow:
                    item.status === "In Progress"
                      ? "0 0 0 5px rgba(245,158,11,0.12)"
                      : "none",
                }}
              />

              {index < timeline.length - 1 ? (
                <Box
                  sx={{
                    width: 2,
                    height: 42,
                    bgcolor: "rgba(148,163,184,0.22)",
                    mt: 0.8,
                  }}
                />
              ) : null}
            </Box>

            <Box
              sx={{
                p: 1.4,
                borderRadius: 2,
                bgcolor: "#0f1b2f",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography sx={{ fontWeight: 850, fontSize: 15 }}>
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
                          : "#94a3b8",
                    fontWeight: 800,
                  }}
                >
                  {item.status}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                {item.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
