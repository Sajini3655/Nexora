import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  LinearProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import Card from "../../../components/ui/Card.jsx";
import ErrorBoundary from "../../../components/ui/ErrorBoundary.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import ChatBox from "../chat/src/ChatBox";
import { getProjectSessions } from "../chat/src/api";
import { loadTasks } from "../../data/taskStore";
import { fetchProjectTasksFromBackend } from "../../data/taskApi";

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

function buildProjects(tasks) {
  const groups = new Map();
  tasks.forEach((task) => {
    const key = String(task.projectId || task.project?.id || "project-unknown");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  });
  return [...groups.entries()].map(([key, list]) => {
    const total = list.length;
    const done = list.filter((task) => String(task.status).toLowerCase() === "completed" || String(task.status).toLowerCase() === "done").length;
    const totalPointValue = list.reduce((sum, task) => sum + Number(task.totalPointValue || 0), 0);
    const completedPointValue = list.reduce((sum, task) => sum + Number(task.completedPointValue || 0), 0);
    const progress = totalPointValue > 0 ? Math.round((completedPointValue * 100) / totalPointValue) : (total === 0 ? 0 : Math.round((done / total) * 100));
    return {
      id: String(list[0]?.projectId || key),
      name: list[0]?.projectName || `Project ${key}`,
      description: list[0]?.projectDescription || list[0]?.description || "Read-only project collaboration view.",
      progress,
      taskCount: total,
      status: progress === 100 ? "Completed" : progress > 0 ? "Active" : "Planning",
      tasks: list,
    };
  });
}

export default function DevProjectView() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState(() => loadTasks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const currentUserId = String(user?.id || user?.email || "");
  const currentUserName = user?.name || user?.email || "Developer";

  // Fetch chat sessions using React Query with 30s refetch interval
  const { data: sessions = [], isLoading: chatListLoading, error: chatListQueryError } = useQuery({
    queryKey: ["projectSessions", project?.id],
    queryFn: () => getProjectSessions(String(project.id)),
    enabled: !!(project && !authLoading),
    refetchInterval: 30000,
    staleTime: 0,
  });

  const chatListError = chatListQueryError?.message || "";

  const activeSessions = useMemo(() => sessions.filter((s) => !s.ended), [sessions]);
  const endedSessions = useMemo(() => sessions.filter((s) => Boolean(s.ended)), [sessions]);

  const recentSummaries = useMemo(() => {
    return sessions
      .filter((session) => Boolean(session.ended) && Boolean(session.summary))
      .sort((a, b) => getSessionSortTime(b) - getSessionSortTime(a))
      .slice(0, 5);
  }, [sessions]);

  const handleChatEnd = useCallback(() => {
    setSelectedSessionId(null);
    refetchSessions();
  }, [refetchSessions]);

  const releaseFocusedElement = () => {
    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress sx={{ color: "#6b51ff" }} />
      </Box>
    );
  }

  if (!project) {
    return (
      <>
        {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Project not found</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(231,233,238,0.72)" }}>
            No assigned project matches <strong>{id}</strong>.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip component={Link} clickable to="/dev/projects" label="Back to projects" />
          </Box>
        </Card>
      </>
    );
  }

  const handleOpenSession = (sessionId) => {
    releaseFocusedElement();
    setSelectedSessionId(sessionId);
    setChatDrawerOpen(true);
  };

  const handleOpenNewChat = () => {
    releaseFocusedElement();
    setSelectedSessionId(null); // null means create new
    setChatDrawerOpen(true);
  };

  return (
    <ErrorBoundary>
      <>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)" }}>Assigned Project</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>{project.name}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(231,233,238,0.72)" }}>
            {project.taskCount} tasks • {project.progress}% complete
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip component={Link} clickable to="/dev/projects" label="Back" />
          <Chip label="Read only" variant="outlined" sx={{ color: "#cbd5e1", borderColor: "rgba(148,163,184,0.25)" }} />
        </Stack>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Project Details</Typography>
            <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.76)" }}>
              Read-only project view for developers. Use the project chat below to discuss work, blockers, and coordination.
            </Typography>

            <Paper sx={{ mt: 2.5, p: 2.2, borderRadius: 3, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Stack spacing={1.25}>
                <InfoRow label="Project name" value={project.name} />
                <InfoRow label="Project id" value={project.id} />
                <InfoRow label="Status" value={project.status} />
                <InfoRow label="Task count" value={project.taskCount} />
                <InfoRow label="Progress" value={`${project.progress}%`} />
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.7 }}>
                  <Typography variant="caption">Progress</Typography>
                  <Typography variant="caption">{project.progress}%</Typography>
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

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Tasks with assigned developers</Typography>
              <Stack spacing={1.5}>
                {project.tasks.map((task) => (
                  <Paper
                    key={task.id}
                    sx={{
                      p: 1.25,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900 }}>{task.title}</Typography>
                          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.64)", mt: 0.4 }}>
                            {task.description ? task.description : "No description."}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <StatusBadge label={String(task.status || "Todo")} />
                          <Chip size="small" label={task.priority || "Medium"} />
                        </Stack>
                      </Stack>

                      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Assigned</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{task.assignedToName || task.assignee || "Unassigned"}</Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)", textAlign: "right" }}>Task</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, textAlign: "right" }}>{task.id}</Typography>
                        </Box>
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ width: '65%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={task.progressPercentage || 0}
                            sx={{
                              height: 7,
                              borderRadius: 999,
                              bgcolor: "rgba(255,255,255,0.06)",
                              "& .MuiLinearProgress-bar": { bgcolor: "#38bdf8" },
                            }}
                          />
                        </Box>

                        <Box>
                          <Chip
                            component={Link}
                            clickable
                            to={`/dev/tasks/${task.id}`}
                            label="Open"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.8 }}>Team Chat</Typography>
                <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.76)" }}>
                  {activeSessions.length > 0 ? `${activeSessions.length} active thread${activeSessions.length !== 1 ? 's' : ''}` : "No active chat threads."}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<ChatBubbleRoundedIcon />}
                  label={`Active: ${activeSessions.length}`}
                  sx={{
                    bgcolor: activeSessions.length > 0 ? "rgba(59,130,246,0.16)" : "rgba(148,163,184,0.12)",
                    color: activeSessions.length > 0 ? "#bfdbfe" : "#cbd5e1",
                    fontWeight: 900,
                  }}
                />
              </Stack>

              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={handleOpenNewChat}
                disabled={!currentUserId || authLoading}
                sx={{ fontWeight: 900 }}
              >
                New Chat
              </Button>

              {chatListLoading && sessions.length === 0 ? (
                <Paper sx={{ p: 2.2, borderRadius: 3, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <CircularProgress size={18} sx={{ color: "#6b51ff" }} />
                    <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.76)" }}>Loading chat sessions...</Typography>
                  </Stack>
                </Paper>
              ) : chatListError ? (
                <Alert severity="warning">{chatListError}</Alert>
              ) : !chatListLoading && activeSessions.length === 0 && endedSessions.length === 0 ? (
                <Paper
                  sx={{
                    p: 2.2,
                    borderRadius: 4,
                    background: "linear-gradient(180deg, rgba(18,31,54,0.88), rgba(10,18,34,0.96))",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Typography sx={{ fontWeight: 900, color: "#f8fafc", mb: 0.5 }}>
                    No chat threads yet.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>
                    Click the button above to start a new discussion.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {activeSessions.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "#93c5fd", fontWeight: 900, textTransform: "uppercase" }}>Active Threads</Typography>
                      <Stack spacing={1.2} sx={{ mt: 1 }}>
                        {activeSessions.map((session) => (
                          <ChatThreadCard
                            key={session.id}
                            session={session}
                            onClick={() => handleOpenSession(session.id)}
                            currentUserId={currentUserId}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}

              <Paper
                sx={{
                  p: 2.2,
                  borderRadius: 4,
                  background: "linear-gradient(180deg, rgba(18,31,54,0.88), rgba(10,18,34,0.96))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  mt: 0.5,
                }}
              >
                <Stack spacing={1.4}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
                      Recent Chat Summaries
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>
                      Last five ended chats for this project.
                    </Typography>
                  </Box>

                  {recentSummaries.length > 0 ? (
                    <Stack spacing={1.2}>
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
                            "&:hover": {
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

                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<OpenInNewRoundedIcon />}
                                sx={{ whiteSpace: "nowrap", fontWeight: 900 }}
                              >
                                View
                              </Button>
                            </Stack>

                            <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.82)" }}>
                              {buildSummaryPreview(session)}
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip size="small" label={`${session.messageCount || 0} messages`} sx={{ bgcolor: "rgba(59,130,246,0.16)", color: "#bfdbfe", fontWeight: 800 }} />
                              {session.endedAt ? <Chip size="small" label="Ended" sx={{ bgcolor: "rgba(107,114,128,0.16)", color: "#d1d5db", fontWeight: 800 }} /> : null}
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Paper sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>
                        No ended chat summaries yet.
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              </Paper>

              {authLoading ? (
                <Box sx={{ display: "grid", placeItems: "center", minHeight: 80 }}>
                  <CircularProgress sx={{ color: "#6b51ff" }} />
                </Box>
              ) : null}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Centered Dialog-based Chat Modal */}
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
                projectId={String(project.id)}
                projectName={project.name}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                selectedSessionId={selectedSessionId}
                hideSidebar
                hideNewChatButton
                onSummary={handleChatEnd}
                onClose={() => setChatDrawerOpen(false)}
              />
            </Box>
          ) : (
            <Alert severity="info" sx={{ m: 2 }}>
              Sign in to use the project chat.
            </Alert>
          )}
        </DialogContent>
      </Dialog>
      </>
    </ErrorBoundary>
  );
}

function ChatThreadCard({ session, onClick, currentUserId, ended = false }) {
  const isStarter = String(session.startedById) === currentUserId;

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 3,
        background: ended
          ? "rgba(107,114,128,0.08)"
          : "linear-gradient(135deg, rgba(30,58,138,0.24), rgba(15,23,42,0.28))",
        border: ended ? "1px solid rgba(107,114,128,0.16)" : "1px solid rgba(59,130,246,0.2)",
        cursor: "pointer",
        transition: "all 200ms ease",
        "&:hover": {
          background: ended
            ? "rgba(107,114,128,0.12)"
            : "linear-gradient(135deg, rgba(30,58,138,0.32), rgba(15,23,42,0.36))",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        },
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={ended ? "Ended" : "Active"}
                sx={{
                  bgcolor: ended ? "rgba(107,114,128,0.24)" : "rgba(34,197,94,0.24)",
                  color: ended ? "#d1d5db" : "#86efac",
                  fontWeight: 900,
                }}
              />
              {isStarter && (
                <Chip
                  size="small"
                  label="You started"
                  sx={{
                    bgcolor: "rgba(139,92,246,0.16)",
                    color: "#d8b4fe",
                    fontWeight: 700,
                  }}
                />
              )}
            </Stack>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewRoundedIcon />}
            sx={{ whiteSpace: "nowrap", fontWeight: 900 }}
          >
            {ended ? "View" : "Open"}
          </Button>
        </Stack>

        <Stack spacing={0.6} sx={{ py: 0.5 }}>
          <Row label="Started by" value={session.startedByName || "Unknown"} />
          <Row label="Started" value={formatChatTime(session.startedAt) || "Recently"} />
          {session.lastMessagePreview && (
            <Row
              label="Last message"
              value={session.lastMessagePreview.length > 60 ? session.lastMessagePreview.substring(0, 60) + "..." : session.lastMessagePreview}
            />
          )}
          <Row label="Messages" value={String(session.messageCount || 0)} />
        </Stack>
      </Stack>
    </Paper>
  );
}

function Row({ label, value }) {
  return (
    <Stack direction="row" spacing={0.6} justifyContent="space-between" alignItems="flex-start">
      <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.52)", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "#e2e8f0", fontWeight: 700, textAlign: "right", wordBreak: "break-word", maxWidth: "65%" }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function Metric({ label, value }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>{label}</Typography>
      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 800 }}>{value}</Typography>
    </Box>
  );
}

function InfoRow({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>{label}</Typography>
      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 800, wordBreak: "break-word" }}>{String(value ?? "-")}</Typography>
    </Box>
  );
}



