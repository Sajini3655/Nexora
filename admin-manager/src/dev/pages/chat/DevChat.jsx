import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Link, useParams } from "react-router-dom";
import ChatBox from "./src/ChatBox";
import { createProjectTicket } from "./src/api";
import { useAuth } from "../../../context/AuthContext";
import { fetchAssignedTasksFromBackend } from "../../data/taskApi";

const DevChat = () => {
  const { projectId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [summary, setSummary] = useState(null);
  const [resolvedProjectId, setResolvedProjectId] = useState("");
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState("");

  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketChoiceDone, setTicketChoiceDone] = useState(false);
  const [ticketStatus, setTicketStatus] = useState("");

  const routeProjectId = useMemo(
    () => String(projectId || "").trim(),
    [projectId]
  );

  useEffect(() => {
    let active = true;

    const resolveProjectId = async () => {
      try {
        setLoadingProject(true);
        setError("");

        if (routeProjectId && /^\d+$/.test(routeProjectId)) {
          if (active) {
            setResolvedProjectId(routeProjectId);
          }
          return;
        }

        const tasks = await fetchAssignedTasksFromBackend();

        const firstProjectId = Array.isArray(tasks)
          ? tasks.find((task) => task?.projectId != null)?.projectId
          : null;

        if (!active) {
          return;
        }

        if (firstProjectId != null) {
          setResolvedProjectId(String(firstProjectId));
        } else {
          setResolvedProjectId("");
          setError(
            "No backend project is available for chat yet. Sync tasks from the dashboard first."
          );
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setResolvedProjectId("");
        setError(err?.message || "Failed to resolve a backend project for chat.");
      } finally {
        if (active) {
          setLoadingProject(false);
        }
      }
    };

    resolveProjectId();

    return () => {
      active = false;
    };
  }, [routeProjectId]);

  const currentUserId = user?.id != null ? String(user.id) : "";
  const currentUserName = user?.name || user?.email || "Developer";

  const readyToChat = Boolean(
    resolvedProjectId && currentUserId && !authLoading && !loadingProject
  );

  const resetTicketPromptForNewSummary = (data) => {
    setSummary(data);
    setTicketChoiceDone(false);
    setTicketStatus("");
  };

  const hasBlockers = () => {
    return Array.isArray(summary?.blockers) && summary.blockers.length > 0;
  };

  const getTicketReason = () => {
    const blockers = Array.isArray(summary?.blockers) ? summary.blockers : [];

    if (blockers.length > 0) {
      return blockers[0];
    }

    const cleanSummary = String(summary?.summary || "").trim();

    if (!cleanSummary) {
      return "Ticket requested from ended developer chat.";
    }

    return cleanSummary.length > 180
      ? cleanSummary.substring(0, 180) + "..."
      : cleanSummary;
  };

  const handleCreateTicket = async () => {
    if (!summary || !resolvedProjectId || !hasBlockers()) {
      return;
    }

    try {
      setCreatingTicket(true);
      setTicketStatus("");

      const reason = getTicketReason();
      const created = await createProjectTicket(resolvedProjectId, reason);

      const createdTicket = {
        ticket_id: String(created?.id ?? "UNKNOWN"),
        blocker: reason,
      };

      const updatedSummary = {
        ...summary,
        tickets_created: [
          ...(Array.isArray(summary.tickets_created)
            ? summary.tickets_created
            : []),
          createdTicket,
        ],
        ticket_message: "Ticket created successfully from chat summary.",
        ticket_prompt_needed: false,
      };

      setSummary(updatedSummary);
      setTicketChoiceDone(true);
      setTicketStatus(
        `Ticket created successfully. Ticket ID: ${createdTicket.ticket_id}`
      );
    } catch (err) {
      setTicketStatus(err?.message || "Failed to create ticket.");
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSkipTicket = () => {
    setTicketChoiceDone(true);
    setTicketStatus("Ticket creation skipped.");
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>
          Developer Chat
        </Typography>

        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)" }}>
          Backend-backed project chat with websocket updates and AI summary capture.
        </Typography>
      </Stack>

      {authLoading || loadingProject ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 260 }}>
          <CircularProgress sx={{ color: "#6b51ff" }} />
        </Box>
      ) : null}

      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}

          <Box sx={{ mt: 1 }}>
            <Button
              component={Link}
              to="/dev"
              variant="outlined"
              size="small"
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.16)",
              }}
            >
              Back to dashboard
            </Button>
          </Box>
        </Alert>
      ) : null}

      {readyToChat ? (
        <ChatBox
          projectId={resolvedProjectId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onSummary={resetTicketPromptForNewSummary}
        />
      ) : null}

      {summary ? (
        <Box
          sx={{
            mt: 3,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            p: 2,
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
            Chat Summary
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "rgba(231,233,238,0.86)",
              whiteSpace: "pre-wrap",
            }}
          >
            {summary.summary}
          </Typography>

          {hasBlockers() ? (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, mb: 1, color: "#ffb4b4" }}
              >
                Detected Blockers
              </Typography>

              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {summary.blockers.map((blocker, index) => (
                  <li key={`${blocker}-${index}`}>{blocker}</li>
                ))}
              </ul>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: "#9fffc2",
                fontWeight: 700,
              }}
            >
              No blockers detected. No ticket is needed.
            </Typography>
          )}

          {Array.isArray(summary.tickets_created) &&
          summary.tickets_created.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Tickets Created
              </Typography>

              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {summary.tickets_created.map((ticket) => (
                  <li key={ticket.ticket_id}>
                    {ticket.ticket_id}: {ticket.blocker}
                  </li>
                ))}
              </ul>
            </Box>
          ) : null}

          {!ticketChoiceDone && hasBlockers() ? (
            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: 3,
                background: "rgba(122,92,255,0.14)",
                border: "1px solid rgba(122,92,255,0.28)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
                Do you want to create a ticket for this blocker?
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "rgba(231,233,238,0.76)", mb: 1.5 }}
              >
                This will create a high-priority ticket for the manager to review
                and assign.
              </Typography>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={handleCreateTicket}
                  disabled={creatingTicket}
                  sx={{
                    fontWeight: 800,
                    background: "linear-gradient(90deg, #6b51ff, #8b5cf6)",
                  }}
                >
                  {creatingTicket ? "Creating..." : "Create Ticket"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleSkipTicket}
                  disabled={creatingTicket}
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.2)",
                    fontWeight: 800,
                  }}
                >
                  Skip
                </Button>
              </Stack>
            </Box>
          ) : null}

          {ticketStatus ? (
            <Typography
              variant="body2"
              sx={{
                mt: 1.5,
                color: ticketStatus.toLowerCase().includes("failed")
                  ? "#ff8a8a"
                  : "#9fffc2",
              }}
            >
              {ticketStatus}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};

export default DevChat;