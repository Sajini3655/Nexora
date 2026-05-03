import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import ErrorNotice from "/src/components/ui/ErrorNotice.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import ChatBox from "../../../dev/pages/chat/src/ChatBox";
import { getProjectSessions } from "../../../dev/pages/chat/src/api";
import { useProjectDetails } from "../../data/useManager";

function getDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1 }}>
      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: "#f8fafc", fontWeight: 700, textAlign: "right" }}>
        {value}
      </Typography>
    </Box>
  );
}

function formatChatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSessionSortTime(session) {
  const value = session?.endedAt || session?.createdAt || session?.startedAt || 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function buildSummaryPreview(session) {
  const summary = String(session?.summary || session?.lastMessagePreview || "").trim();
  if (!summary) return "No summary available yet.";
  return summary.length > 160 ? `${summary.substring(0, 160)}...` : summary;
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const currentUserId = user?.id != null ? String(user.id) : "";
  const currentUserName = user?.name || user?.email || "Manager";

  const { data: project, isLoading, error } = useProjectDetails(projectId, true);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [chatListLoading, setChatListLoading] = useState(false);
  const [chatListError, setChatListError] = useState("");
  const [sessions, setSessions] = useState([]);

  const taskSummary = useMemo(() => {
    if (!project?.tasks?.length) return { open: 0, inProgress: 0, done: 0 };

    const open = project.tasks.filter((task) => String(task?.status || "").toLowerCase() === "open").length;
    const inProgress = project.tasks.filter((task) => String(task?.status || "").toLowerCase() === "in progress").length;
    const done = project.tasks.filter((task) => String(task?.status || "").toLowerCase() === "done").length;
    return { open, inProgress, done };
  }, [project]);

  const progress = Number(project?.progress ?? 0);
  const updatedAt = useMemo(() => {
    if (!project?.tasks?.length) return "-";
    const sorted = [...project.tasks].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    return getDateLabel(sorted[0]?.updatedAt || sorted[0]?.createdAt);
  }, [project]);

  const loadProjectSessions = useCallback(async () => {
    if (!projectId || authLoading) return;

    try {
      setChatListLoading(true);
      setChatListError("");

      const allSessions = await getProjectSessions(String(projectId));
      setSessions(Array.isArray(allSessions) ? allSessions : []);
    } catch (err) {
      const aborted =
        err?.name === "AbortError" ||
        String(err?.message || "").toLowerCase().includes("aborted");

      if (!aborted) {
        setChatListError(err?.message || "Failed to load chat sessions.");
      }
    } finally {
      setChatListLoading(false);
    }
  }, [projectId, authLoading]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await loadProjectSessions();
    };

    run();

    const intervalId = window.setInterval(run, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [loadProjectSessions]);

  const activeSessions = useMemo(
    () => sessions.filter((session) => !session.ended),
    [sessions]
  );

  const recentSummaries = useMemo(() => {
    return sessions
      .filter((session) => Boolean(session.ended) && Boolean(session.summary))
      .sort((a, b) => getSessionSortTime(b) - getSessionSortTime(a))
      .slice(0, 5);
  }, [sessions]);

  const releaseFocusedElement = () => {
    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
  };

  const handleOpenSession = (sessionId) => {
    releaseFocusedElement();
    setSelectedSessionId(String(sessionId));
    setChatDrawerOpen(true);
  };

  const handleOpenNewChat = () => {
    releaseFocusedElement();
    setSelectedSessionId(null);
    setChatDrawerOpen(true);
  };

  const handleChatEnd = useCallback(() => {
    setSelectedSessionId(null);
    loadProjectSessions();
  }, [loadProjectSessions]);

  if (isLoading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
        <CircularProgress sx={{ color: "#6d5dfc" }} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#0b1628", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "none" }}>
        {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error.message || error}</Alert> : null}
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          Project not found
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
          The requested project does not exist or is not available in your current workspace.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRoundedIcon />}
          component={Link}
          to="/manager"
          sx={{ textTransform: "none", borderColor: "rgba(255,255,255,0.14)", color: "#cbd5e1" }}
        >
          Back to dashboard
        </Button>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: 1 }}>
            Project Detail
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
            {project.name || project.projectName || `Project ${projectId}`}
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1, maxWidth: 720 }}>
            A concise manager view of this project’s status, task summary, and progress.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <StatusBadge label={project.status || "Unknown"} size="medium" />
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/manager")}
            sx={{ textTransform: "none", borderColor: "rgba(255,255,255,0.14)", color: "#cbd5e1" }}
          >
            Dashboard
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2.25, borderRadius: 3, bgcolor: "#0b1628", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "none", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              Overview
            </Typography>
            <DetailRow label="Project ID" value={projectId} />
            <DetailRow label="Manager" value={project.manager || "Unassigned"} />
            <DetailRow label="Requests" value={`${project.tasks?.length ?? 0}`} />
            <DetailRow label="Last updated" value={updatedAt} />
            <DetailRow label="Progress" value={`${progress}%`} />

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Overall progress
                </Typography>
                <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                    {progress}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)", "& .MuiLinearProgress-bar": { bgcolor: "#6d5dfc" } }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2.25, borderRadius: 3, bgcolor: "#0b1628", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "none", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              Task summary
            </Typography>
            <Stack spacing={1.25}>
              <DetailRow label="Open" value={taskSummary.open} />
              <DetailRow label="In progress" value={taskSummary.inProgress} />
              <DetailRow label="Done" value={taskSummary.done} />
            </Stack>
            <Box sx={{ mt: 3 }}>
              <Button
                component={Link}
                to={`/manager/project-management/${projectId}`}
                variant="contained"
                sx={{ textTransform: "none", bgcolor: "#6d5dfc", color: "#fff", fontWeight: 800, boxShadow: "none", '&:hover': { bgcolor: '#5b4ee6' } }}
              >
                Open management view
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2.25, borderRadius: 3, bgcolor: "#0b1628", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "none" }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.75 }}>
                    Project Chat
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                    {activeSessions.length > 0
                      ? `${activeSessions.length} active thread${activeSessions.length !== 1 ? "s" : ""}`
                      : "No active chat threads."}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleOpenNewChat}
                  disabled={!currentUserId || authLoading}
                  sx={{ textTransform: "none", bgcolor: "#6d5dfc", color: "#fff", fontWeight: 800, boxShadow: "none", '&:hover': { bgcolor: '#5b4ee6' } }}
                >
                  New Chat
                </Button>
              </Stack>

              {chatListLoading && sessions.length === 0 ? (
                <Box sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <CircularProgress size={18} sx={{ color: "#6b51ff" }} />
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      Loading chat sessions...
                    </Typography>
                  </Stack>
                </Box>
              ) : chatListError ? (
                <ErrorNotice message={chatListError} severity="warning" />
              ) : (
                <Stack spacing={2}>
                  {activeSessions.length > 0 ? (
                    <Stack spacing={1.25}>
                      {activeSessions.map((session) => (
                        <Paper
                          key={session.id}
                          onClick={() => handleOpenSession(session.id)}
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            background: "linear-gradient(135deg, rgba(30,58,138,0.24), rgba(15,23,42,0.28))",
                            border: "1px solid rgba(59,130,246,0.2)",
                            cursor: "pointer",
                            transition: "all 200ms ease",
                            '&:hover': {
                              background: "linear-gradient(135deg, rgba(30,58,138,0.32), rgba(15,23,42,0.36))",
                            },
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography sx={{ fontWeight: 900, color: "#f8fafc" }}>
                                  {session.startedByName || "Unknown"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.58)" }}>
                                  {formatChatTime(session.startedAt) || "Recently"}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                {session.messageCount || 0} messages
                              </Typography>
                            </Stack>

                            {session.lastMessagePreview ? (
                              <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                                {session.lastMessagePreview.length > 100
                                  ? `${session.lastMessagePreview.substring(0, 100)}...`
                                  : session.lastMessagePreview}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : null}

                  <Paper sx={{ p: 1.75, borderRadius: 3, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>Recent Chat Summaries</Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1 }}>
                      Latest 5 ended chat summaries for this project.
                    </Typography>

                    {recentSummaries.length > 0 ? (
                      <Stack spacing={1}>
                        {recentSummaries.map((session) => (
                          <Paper
                            key={session.id}
                            onClick={() => handleOpenSession(session.id)}
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              cursor: "pointer",
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              transition: "all 180ms ease",
                              '&:hover': {
                                background: "rgba(255,255,255,0.07)",
                                borderColor: "rgba(96,165,250,0.28)",
                              },
                            }}
                          >
                            <Stack spacing={1}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 900, color: "#f8fafc" }}>
                                    {session.startedByName || "Unknown"}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.58)" }}>
                                    {formatChatTime(session.endedAt || session.startedAt)}
                                  </Typography>
                                </Box>
                                <Button size="small" variant="outlined" sx={{ whiteSpace: "nowrap", fontWeight: 900 }}>
                                  View
                                </Button>
                              </Stack>

                              <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                                {buildSummaryPreview(session)}
                              </Typography>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Paper sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                          No ended chat summaries yet.
                        </Typography>
                      </Paper>
                    )}
                  </Paper>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: "94vw", sm: "94vw", md: "760px", lg: "820px" },
            maxHeight: "82vh",
            maxWidth: "none",
            background: "linear-gradient(180deg, rgba(8,15,28,0.98), rgba(6,11,21,0.99))",
            border: "1px solid rgba(148,163,184,0.14)",
            backdropFilter: "blur(18px)",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
          },
        }}
        BackdropProps={{
          sx: {
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            background: "#0b1628",
            borderRadius: 4,
          }}
        >
          {currentUserId ? (
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <ChatBox
                projectId={String(projectId)}
                projectName={project.name || project.projectName || `Project ${projectId}`}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                selectedSessionId={selectedSessionId}
                hideSidebar
                hideNewChatButton
                onSummary={handleChatEnd}
                onClose={() => {
                  setChatDrawerOpen(false);
                  loadProjectSessions();
                }}
              />
            </Box>
          ) : (
            <ErrorNotice message={"Sign in to use the project chat."} severity="info" sx={{ m: 2 }} />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
