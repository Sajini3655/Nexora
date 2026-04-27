import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
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
  const [projectName, setProjectName] = useState("Project chat");
  const [taskCount, setTaskCount] = useState(0);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState("");

  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketChoiceDone, setTicketChoiceDone] = useState(false);
  const [ticketStatus, setTicketStatus] = useState("");

  const routeProjectId = useMemo(() => String(projectId || "").trim(), [projectId]);

  useEffect(() => {
    let active = true;

    const resolveProjectId = async () => {
      try {
        setLoadingProject(true);
        setError("");

        const tasks = await fetchAssignedTasksFromBackend();
        const safeTasks = Array.isArray(tasks) ? tasks : [];

        let selectedProjectId = "";
        let selectedProjectName = "Project chat";

        if (routeProjectId && /^\d+$/.test(routeProjectId)) {
          selectedProjectId = routeProjectId;
          const matched = safeTasks.find((task) => String(task?.projectId) === String(routeProjectId));
          selectedProjectName = matched?.projectName || `Project ${routeProjectId}`;
        } else {
          const firstProjectTask = safeTasks.find((task) => task?.projectId != null);
          if (firstProjectTask?.projectId != null) {
            selectedProjectId = String(firstProjectTask.projectId);
            selectedProjectName = firstProjectTask.projectName || `Project ${firstProjectTask.projectId}`;
          }
        }

        if (!active) return;

        if (selectedProjectId) {
          setResolvedProjectId(selectedProjectId);
          setProjectName(selectedProjectName);
          setTaskCount(
            safeTasks.filter((task) => String(task?.projectId) === String(selectedProjectId)).length
          );
        } else {
          setResolvedProjectId("");
          setProjectName("Project chat");
          setTaskCount(0);
          setError("No backend project is available for chat yet. Sync tasks from the dashboard first.");
        }
      } catch (err) {
        if (!active) return;
        setResolvedProjectId("");
        setProjectName("Project chat");
        setTaskCount(0);
        setError(err?.message || "Failed to resolve a backend project for chat.");
      } finally {
        if (active) setLoadingProject(false);
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

  const blockers = Array.isArray(summary?.blockers) ? summary.blockers : [];
  const hasBlockers = blockers.length > 0;

  const getTicketReason = () => {
    if (blockers.length > 0) return blockers[0];

    const cleanSummary = String(summary?.summary || "").trim();
    if (!cleanSummary) return "Ticket requested from ended developer chat.";

    return cleanSummary.length > 180 ? cleanSummary.substring(0, 180) + "..." : cleanSummary;
  };

  const handleCreateTicket = async () => {
    if (!summary || !resolvedProjectId || !hasBlockers) return;

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
          ...(Array.isArray(summary.tickets_created) ? summary.tickets_created : []),
          createdTicket,
        ],
        ticket_message: "Ticket created successfully from chat summary.",
        ticket_prompt_needed: false,
      };

      setSummary(updatedSummary);
      setTicketChoiceDone(true);
      setTicketStatus(`Ticket created successfully. Ticket ID: ${createdTicket.ticket_id}`);
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
    <Box sx={{ px: { xs: 1.5, md: 2.5 }, py: { xs: 1.5, md: 2.5 } }}>
      <Stack spacing={2.2}>
        <Paper
          sx={{
            p: { xs: 2, md: 2.3 },
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(15,27,47,0.96), rgba(11,22,40,0.98))",
            border: "1px solid rgba(148,163,184,0.14)",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", lg: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="overline" sx={{ color: "#93c5fd", fontWeight: 900 }}>
                Developer / Chat
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.4 }}>
                Project Collaboration Chat
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                Discuss project issues, capture AI summaries, and create tickets from blockers.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <InfoPill icon={<ChatBubbleRoundedIcon />} label="Project" value={projectName} />
              <InfoPill icon={<GroupsRoundedIcon />} label="Tasks" value={String(taskCount)} />
              <InfoPill icon={<AutoAwesomeRoundedIcon />} label="AI Summary" value={summary ? "Ready" : "Waiting"} />
            </Stack>
          </Stack>
        </Paper>

        {authLoading || loadingProject ? (
          <Paper sx={{ minHeight: 320, display: "grid", placeItems: "center" }}>
            <Stack direction="row" alignItems="center" spacing={1.4}>
              <CircularProgress size={22} sx={{ color: "#6d5dfc" }} />
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                Preparing project chat...
              </Typography>
            </Stack>
          </Paper>
        ) : null}

        {error ? (
          <Alert severity="warning">
            {error}
            <Box sx={{ mt: 1 }}>
              <Button component={Link} to="/dev" variant="outlined" size="small">
                Back to dashboard
              </Button>
            </Box>
          </Alert>
        ) : null}

        {readyToChat ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 330px" },
              gap: 2,
              alignItems: "stretch",
            }}
          >
            <ChatBox
              projectId={resolvedProjectId}
              projectName={projectName}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onSummary={resetTicketPromptForNewSummary}
            />

            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                minHeight: { xs: "auto", xl: 640 },
                alignSelf: "stretch",
                background: "linear-gradient(180deg, rgba(15,27,47,0.98), rgba(11,22,40,0.98))",
              }}
            >
              <Stack spacing={1.8}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AutoAwesomeRoundedIcon sx={{ color: "#a78bfa", fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 950 }}>AI Summary</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                    End the chat to generate a summary and detect blockers.
                  </Typography>
                </Box>

                <Divider />

                {!summary ? (
                  <EmptyPanel
                    title="No summary yet"
                    text="When the chat ends, the summary and ticket suggestion will appear here."
                  />
                ) : (
                  <Stack spacing={1.5}>
                    <Box sx={sideBoxStyle}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 900 }}>
                        SUMMARY
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#e2e8f0", whiteSpace: "pre-wrap", mt: 0.8 }}>
                        {summary.summary || "No summary generated."}
                      </Typography>
                    </Box>

                    <Box sx={sideBoxStyle}>
                      <Typography variant="caption" sx={{ color: hasBlockers ? "#fca5a5" : "#86efac", fontWeight: 900 }}>
                        BLOCKERS
                      </Typography>

                      {hasBlockers ? (
                        <Stack spacing={0.8} sx={{ mt: 1 }}>
                          {blockers.map((blocker, index) => (
                            <Typography key={`${blocker}-${index}`} variant="body2" sx={{ color: "#fecaca" }}>
                              • {blocker}
                            </Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: "#86efac", mt: 0.8 }}>
                          No blockers detected.
                        </Typography>
                      )}
                    </Box>

                    {Array.isArray(summary.tickets_created) && summary.tickets_created.length > 0 ? (
                      <Box sx={sideBoxStyle}>
                        <Typography variant="caption" sx={{ color: "#93c5fd", fontWeight: 900 }}>
                          TICKETS CREATED
                        </Typography>
                        <Stack spacing={0.8} sx={{ mt: 1 }}>
                          {summary.tickets_created.map((ticket) => (
                            <Typography key={ticket.ticket_id} variant="body2" sx={{ color: "#dbeafe" }}>
                              #{ticket.ticket_id}: {ticket.blocker}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    ) : null}

                    {!ticketChoiceDone && hasBlockers ? (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: "1px solid rgba(109,93,252,0.28)",
                          background: "rgba(109,93,252,0.12)",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ConfirmationNumberRoundedIcon sx={{ color: "#c4b5fd", fontSize: 20 }} />
                          <Typography sx={{ fontWeight: 900 }}>Create a ticket?</Typography>
                        </Stack>

                        <Typography variant="body2" sx={{ color: "#cbd5e1", mt: 0.8 }}>
                          This creates a high-priority ticket for the manager.
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ mt: 1.4 }}>
                          <Button
                            variant="contained"
                            onClick={handleCreateTicket}
                            disabled={creatingTicket}
                            fullWidth
                          >
                            {creatingTicket ? "Creating..." : "Create"}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleSkipTicket}
                            disabled={creatingTicket}
                            fullWidth
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
                          color: ticketStatus.toLowerCase().includes("failed") ? "#fca5a5" : "#86efac",
                          fontWeight: 800,
                        }}
                      >
                        {ticketStatus}
                      </Typography>
                    ) : null}
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
};

function InfoPill({ icon, label, value }) {
  return (
    <Box
      sx={{
        px: 1.4,
        py: 1,
        borderRadius: 2,
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(148,163,184,0.12)",
        minWidth: 120,
      }}
    >
      <Stack direction="row" spacing={0.8} alignItems="center">
        <Box sx={{ color: "#a78bfa", display: "grid", placeItems: "center", "& svg": { fontSize: 18 } }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", lineHeight: 1.1 }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900, color: "#f8fafc", lineHeight: 1.25 }} noWrap>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function EmptyPanel({ title, text }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: "1px dashed rgba(148,163,184,0.24)",
        background: "rgba(255,255,255,0.025)",
      }}
    >
      <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
        {text}
      </Typography>
    </Box>
  );
}

const sideBoxStyle = {
  p: 1.5,
  borderRadius: 2.5,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(148,163,184,0.11)",
};

export default DevChat;
