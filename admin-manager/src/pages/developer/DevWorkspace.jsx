import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";

import { currentProject, aiSummaries } from "../../dev/data/devWorkspaceMock";
import { loadTasks } from "../../dev/data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../dev/data/taskApi";
import {
  addChatMessage,
  closeChatThread,
  createChatThread,
  loadChatThreads,
} from "../../dev/data/chatStore";
import { pushNotification } from "../../dev/data/notificationStore";

function calcPoints(task) {
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  const total = subs.reduce((s, x) => s + Number(x.points || 0), 0);
  const done = subs.filter((x) => x.done).reduce((s, x) => s + Number(x.points || 0), 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export default function DevWorkspace() {
  const navigate = useNavigate();
  const [allTasks, setAllTasks] = useState(() => loadTasks());

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const merged = await syncAssignedTasksToLocalStoreSafe();
      if (alive) setAllTasks(merged);
    };
    run();
    const intervalId = setInterval(run, 4000);
    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, []);

  const assignedTasks = useMemo(
    () => allTasks.filter((t) => t.status === "Assigned"),
    [allTasks]
  );

  const myOpen = useMemo(
    () => allTasks.filter((t) => t.status !== "Completed").length,
    [allTasks]
  );

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 950 }} noWrap>
              {currentProject.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.6 }}>
              Project Code: <b>{currentProject.code}</b> • Manager: <b>{currentProject.manager}</b> • Due: <b>{currentProject.dueDate}</b>
            </Typography>
          </Box>

          <Card sx={{ minWidth: { xs: "100%", md: 360 } }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Project Progress
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.8 }}>
              <Typography sx={{ fontWeight: 950, fontSize: 20 }}>{currentProject.progress}%</Typography>
              <Chip size="small" label={`My open tasks: ${myOpen}`} variant="outlined" />
            </Box>
            <LinearProgress
              variant="determinate"
              value={currentProject.progress}
              sx={{ mt: 1.4, height: 8, borderRadius: 999 }}
            />
          </Card>
        </Stack>

        <Typography variant="body2" sx={{ opacity: 0.86, mt: 2 }}>
          {currentProject.description}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2.5 }}>
        {/* Left */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Card>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>
                Project Tasks
              </Typography>
              <Chip size="small" label={`Assigned: ${assignedTasks.length}`} variant="outlined" />
            </Box>

            {assignedTasks.length === 0 ? (
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                No tasks.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {assignedTasks.map((t) => {
                  const p = calcPoints(t);
                  return (
                    <Card
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/developer/tasks/${t.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/developer/tasks/${t.id}`);
                        }
                      }}
                      sx={{ p: 2, cursor: "pointer" }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900 }} noWrap>
                            {t.title}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.4, display: "block" }}>
                            {t.id} • {t.assignee} • Due {t.dueDate}
                          </Typography>
                        </Box>
                        <Chip size="small" label={t.priority} />
                      </Box>

                      <Box sx={{ mt: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            Subtask points
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {p.done}/{p.total} ({p.pct}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={p.pct}
                          sx={{ mt: 0.7, height: 7, borderRadius: 999 }}
                        />
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Card>

          <Card>
            <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
              Task Progress Analysis
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mb: 2 }}>
              Progress is calculated using subtask story points (done vs total).
            </Typography>

            {assignedTasks.length === 0 ? (
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                No assigned tasks.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {assignedTasks.map((t) => {
                  const p = calcPoints(t);
                  return (
                    <Card key={t.id} sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900 }} noWrap>
                            {t.title}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {t.id} • {t.assignee} • Assigned
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 950 }}>{p.pct}%</Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={p.pct}
                        sx={{ mt: 1.2, height: 7, borderRadius: 999 }}
                      />

                      <Box sx={{ mt: 1.6 }}>
                        {(Array.isArray(t.subtasks) ? t.subtasks : []).map((s) => (
                          <Box key={s.id} sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.5 }}>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              {s.done ? "✅" : "⬜"} {s.title}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {s.points} pts
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Card>
        </Box>

        {/* Right */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <IssueChatPanel
            onCreateTicket={(chatId) => navigate("/developer/tickets/new", { state: { chatId } })}
          />

          <Card>
            <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.5 }}>
              AI Summaries
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              {aiSummaries.map((s) => (
                <Card key={s.id} sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 900 }}>{s.title}</Typography>
                  <Box component="ul" sx={{ mt: 1.1, mb: 0, pl: 2.5 }}>
                    {s.points.map((pt, idx) => (
                      <li key={`${s.id}-pt-${idx}`}>
                        <Typography variant="body2" sx={{ opacity: 0.86 }}>
                          {pt}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Card>
              ))}
            </Box>
            <Button fullWidth sx={{ mt: 2 }} disabled>
              Generate AI Summary (later)
            </Button>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

function IssueChatPanel({ onCreateTicket }) {
  const [threads, setThreads] = useState(() => loadChatThreads());
  const [activeId, setActiveId] = useState(() => (threads[0]?.id ? threads[0].id : ""));

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [endOpen, setEndOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    setThreads(loadChatThreads());
  }, []);

  const createNew = () => {
    const title = newTitle.trim();
    if (!title) return;
    const res = createChatThread(title, "You");
    setThreads(res.threads);
    setActiveId(res.thread.id);
    setNewTitle("");
    setNewOpen(false);
    pushNotification({ title: "New issue chat started", body: title });
  };

  const send = () => {
    if (!active || active.status === "Closed") return;
    const msg = text.trim();
    if (!msg) return;
    const next = addChatMessage(active.id, { sender: "You", role: "Developer", text: msg });
    setThreads(next);
    setText("");
  };

  const endChatOnly = () => {
    if (!active) return;
    const next = closeChatThread(active.id);
    setThreads(next);
    setEndOpen(false);
    pushNotification({ title: "Issue chat ended", body: active.title });
  };

  const endAndCreateTicket = () => {
    if (!active) return;
    const next = closeChatThread(active.id);
    setThreads(next);
    setEndOpen(false);
    pushNotification({ title: "Create ticket", body: `From chat: ${active.title}` });
    onCreateTicket(active.id);
  };

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: 540 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>
            Issue Chats
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.72 }}>
            Start a new chat per issue. End chat → create ticket or close.
          </Typography>
        </Box>
        <Button onClick={() => setNewOpen(true)}>
          + New chat
        </Button>
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Box sx={{ display: "flex", gap: 1.2, alignItems: "center", flexWrap: "wrap" }}>
        <Input
          select
          label="Thread"
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          sx={{ minWidth: 220, flexGrow: 1 }}
        >
          {threads.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.status === "Closed" ? "(Closed) " : ""}
              {t.title}
            </MenuItem>
          ))}
        </Input>

        <Button
          variant="outlined"
          disabled={!active || active.status === "Closed"}
          onClick={() => setEndOpen(true)}
        >
          End chat
        </Button>
      </Box>

      <Box
        sx={{
          mt: 1.5,
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.10)",
          backgroundColor: "rgba(255,255,255,0.03)",
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.2,
        }}
      >
        {(active?.messages || []).map((m) => (
          <Card key={m.id} sx={{ p: 1.6 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                {m.sender} <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>
                  ({m.role})
                </Typography>
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                {m.ts}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.8 }}>
              {m.text}
            </Typography>
          </Card>
        ))}
        {(active?.messages || []).length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            No messages yet.
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ mt: 1.5, display: "flex", gap: 1.2 }}>
        <Input
          label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={active?.status === "Closed" ? "Chat is closed" : "Type a message..."}
          disabled={!active || active.status === "Closed"}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <Button disabled={!active || active.status === "Closed"} onClick={send}>
          Send
        </Button>
      </Box>

      {/* New chat dialog */}
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Start new issue chat</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ opacity: 0.75, mb: 1.5 }}>
            Give this issue a short title.
          </Typography>
          <Input
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Bug: Upload stuck at 0%"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => {
            setNewOpen(false);
            setNewTitle("");
          }}>
            Cancel
          </Button>
          <Button onClick={createNew}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* End chat dialog */}
      <Dialog open={endOpen} onClose={() => setEndOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>End this chat?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Issue: <b>{active?.title}</b>
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.72, mt: 1 }}>
            You can end chat and optionally create a ticket.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ display: "flex", justifyContent: "space-between", gap: 1.2, px: 2.5, pb: 2.2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ width: "100%" }}>
            <Button onClick={endAndCreateTicket} sx={{ flex: 1 }}>
              End & Create Ticket
            </Button>
            <Button variant="outlined" onClick={endChatOnly} sx={{ flex: 1 }}>
              End without Ticket
            </Button>
            <Button variant="outlined" onClick={() => setEndOpen(false)} sx={{ flex: 1 }}>
              Cancel
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
