import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import ChatBox from "./src/ChatBox";
import { useAuth } from "../../../context/AuthContext";
import { fetchAssignedTasksFromBackend } from "../../data/taskApi";

const DevChat = () => {
  const { projectId } = useParams(); // get projectId from route
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState(null);
  const [resolvedProjectId, setResolvedProjectId] = useState("");
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState("");

  const routeProjectId = useMemo(() => String(projectId || "").trim(), [projectId]);

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
          setError("No backend project is available for chat yet. Sync tasks from the dashboard first.");
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
  const readyToChat = Boolean(resolvedProjectId && currentUserId && !authLoading && !loadingProject);

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
            <Button component={Link} to="/dev" variant="outlined" size="small" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.16)" }}>
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
          onSummary={(data) => setSummary(data)}
        />
      ) : null}

      {summary ? (
        <Box sx={{ mt: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", p: 2, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
            Chat Summary
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.86)" }}>
            {summary.summary}
          </Typography>
          {summary.tickets_created?.length > 0 ? (
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
        </Box>
      ) : null}
    </Box>
  );
};

export default DevChat;