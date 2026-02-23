import React, { useEffect, useMemo, useState } from "react";
import DevLayout from "../../components/layout/DevLayout";
import { useNavigate } from "react-router-dom";
import { currentProject, aiSummaries } from "../../data/devWorkspaceMock";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";
import {
  addChatMessage,
  closeChatThread,
  createChatThread,
  loadChatThreads,
} from "../../data/chatStore";
import { pushNotification } from "../../data/notificationStore";


// ------------------------------
// UI-only demo: project-wide tasks
// (includes tasks NOT assigned to the logged-in developer)
// ------------------------------
const PROJECT_PROGRESS_DEMO_TASKS = [
  {
    id: "DEMO-21",
    title: "Ticket API endpoints (backend)",
    description: "Expose CRUD endpoints for tickets and connect to PostgreSQL.",
    status: "In Progress",
    assignee: "Kavindu",
    dueDate: "2026-03-03",
    priority: "High",
    subtasks: [
      { id: "DEMO-21-ST-1", title: "Define DTOs + contracts", points: 2, done: true },
      { id: "DEMO-21-ST-2", title: "Implement CRUD endpoints", points: 4, done: true },
      { id: "DEMO-21-ST-3", title: "Add validation + tests", points: 3, done: false },
    ],
  },
  {
    id: "DEMO-22",
    title: "Manager dashboard reports",
    description: "Create project reports view and wire it to report endpoints.",
    status: "Assigned",
    assignee: "Ravindu",
    dueDate: "2026-03-06",
    priority: "Medium",
    subtasks: [
      { id: "DEMO-22-ST-1", title: "Reports list UI", points: 3, done: false },
      { id: "DEMO-22-ST-2", title: "Single report view UI", points: 3, done: false },
      { id: "DEMO-22-ST-3", title: "Download/export actions", points: 2, done: false },
    ],
  },
  {
    id: "DEMO-23",
    title: "Client chat widget integration",
    description: "Add bottom-right chat widget for clients and route to chat page.",
    status: "In Progress",
    assignee: "You",
    dueDate: "2026-03-01",
    priority: "High",
    subtasks: [
      { id: "DEMO-23-ST-1", title: "Widget toggle + layout", points: 2, done: true },
      { id: "DEMO-23-ST-2", title: "Message list + composer", points: 3, done: false },
      { id: "DEMO-23-ST-3", title: "Unread badge + notify", points: 2, done: false },
    ],
  },
  {
    id: "DEMO-24",
    title: "Database migration + seed data",
    description: "Add migrations and seed demo projects/users/tasks.",
    status: "Completed",
    assignee: "Kavindu",
    dueDate: "2026-02-20",
    priority: "Low",
    subtasks: [
      { id: "DEMO-24-ST-1", title: "Migration scripts", points: 4, done: true },
      { id: "DEMO-24-ST-2", title: "Seed users/roles", points: 3, done: true },
      { id: "DEMO-24-ST-3", title: "Seed demo tasks/tickets", points: 3, done: true },
    ],
  },
  {
    id: "DEMO-25",
    title: "NLQ navigation (Groq) - UI wiring",
    description: "Wire the dashboard search bar to NLQ endpoint and route to pages.",
    status: "Assigned",
    assignee: "Manager (Sup)",
    dueDate: "2026-03-10",
    priority: "Medium",
    subtasks: [
      { id: "DEMO-25-ST-1", title: "Search bar + command palette UI", points: 3, done: false },
      { id: "DEMO-25-ST-2", title: "Role-based route guard rules", points: 3, done: false },
      { id: "DEMO-25-ST-3", title: "NLQ parse + route mapping", points: 5, done: false },
    ],
  },
];

function calcPoints(task) {
  // Prefer backend-computed progress if available.
  if (typeof task.totalPoints === "number" && typeof task.donePoints === "number") {
    const total = task.totalPoints;
    const done = task.donePoints;
    const pct = typeof task.progressPercent === "number" ? task.progressPercent : total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pct };
  }

  // Fallback: compute from local subtasks (UI cache).
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  const total = subs.reduce((s, x) => s + (Number(x.points) || 0), 0);
  const done = subs.filter((x) => x.done).reduce((s, x) => s + (Number(x.points) || 0), 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

function ProgressBar({ pct }) {
  return (
    <div className="h-2 bg-white/10 rounded-full mt-1">
      <div
        className="h-2 rounded-full"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.9))",
        }}
      />
    </div>
  );
}

export default function DevWorkspace() {
  const navigate = useNavigate();

  const [allTasks, setAllTasks] = useState(() => loadTasks());

  // Pull manager-assigned tasks from backend (light polling for demo).
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


const progressTasks = useMemo(() => {
  // Merge real tasks (from backend/local cache) with UI demo tasks.
  const byId = new Map();
  allTasks.forEach((t) => byId.set(String(t.id), t));
  PROJECT_PROGRESS_DEMO_TASKS.forEach((t) => {
    const id = String(t.id);
    if (!byId.has(id)) byId.set(id, t);
  });
  return Array.from(byId.values());
}, [allTasks]);


  const myOpen = useMemo(() => {
    return allTasks.filter((t) => t.status !== "Completed").length;
  }, [allTasks]);

  return (
    <DevLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold truncate">{currentProject.name}</h2>
            <p className="text-slate-300 mt-1">
              Project Code: <span className="font-semibold">{currentProject.code}</span> • Manager:{" "}
              <span className="font-semibold">{currentProject.manager}</span> • Due:{" "}
              <span className="font-semibold">{currentProject.dueDate}</span>
            </p>
          </div>

          <div className="glass-card p-4 w-full lg:w-[340px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Project Progress</p>
                <p className="text-xl font-bold">{currentProject.progress}%</p>
                <p className="text-xs text-slate-400 mt-1">My open tasks: {myOpen}</p>
              </div>
              <div className="w-28">
                <div className="h-2 bg-white/10 rounded-full">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${currentProject.progress}%`,
                      background:
                        "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.9))",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-slate-200 mt-4">{currentProject.description}</p>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Tasks */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Project Tasks</h3>
              <span className="chip-muted">Assigned: {assignedTasks.length}</span>
            </div>

            {/* Assigned column only */}
            <div className="rounded-2xl p-3 bg-white/5 border border-white/10">
              <p className="font-semibold mb-2">Assigned</p>

              <div className="space-y-3">
                {assignedTasks.map((t) => {
                  const p = calcPoints(t);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => navigate(`/tasks/${t.id}`)}
                      className="text-left w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{t.title}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {t.id} • {t.assignee} • Due {t.dueDate}
                          </p>
                        </div>
                        <span className="chip">{t.priority}</span>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Subtask points</span>
                          <span>
                            {p.done}/{p.total} ({p.pct}%)
                          </span>
                        </div>
                        <ProgressBar pct={p.pct} />
                      </div>
                    </button>
                  );
                })}

                {assignedTasks.length === 0 && (
                  <p className="text-sm text-slate-300">No tasks</p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Analysis */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Task Progress Analysis</h3>
              <span className="chip-muted">Project tasks: {progressTasks.length}</span>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Project-wide progress is calculated using subtask story points (done vs total).
            </p>

            <div className="space-y-3">
              {progressTasks.map((t) => {
                const p = calcPoints(t);
                return (
                  <div key={t.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{t.title}</p>
                        <p className="text-xs text-slate-400">
                          {t.id} • {t.assignee} • {t.status || "Assigned"} • Due {t.dueDate || "-"}
                        </p>
                      </div>
                      <div className="text-sm font-semibold">{p.pct}%</div>
                    </div>

                    <ProgressBar pct={p.pct} />

                    <div className="mt-3 text-xs text-slate-300 space-y-1">
                      {(Array.isArray(t.subtasks) ? t.subtasks : []).map((s) => (
                        <div key={s.id} className="flex justify-between">
                          <span>
                            {s.done ? "✅" : "⬜"} {s.title}
                          </span>
                          <span>{s.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {progressTasks.length === 0 && (
                <p className="text-sm text-slate-300">No project tasks.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <IssueChatPanel
            onCreateTicket={(chatId) => navigate("/tickets/new", { state: { chatId } })}
          />

          {/* AI Summary */}
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-3">AI Summaries</h3>

            <div className="space-y-3">
              {aiSummaries.map((s) => (
                <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold">{s.title}</p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-slate-200 space-y-1">
                    {s.points.map((pt, idx) => (
                      <li key={`${s.id}-pt-${idx}`}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full btn-primary">Generate AI Summary (later)</button>
          </div>
        </div>
      </div>
    </DevLayout>
  );
}

function IssueChatPanel({ onCreateTicket }) {
  const [threads, setThreads] = useState(() => loadChatThreads());
  const [activeId, setActiveId] = useState(() => (threads[0]?.id ? threads[0].id : null));

  const active = useMemo(() => threads.find((t) => t.id === activeId) || null, [threads, activeId]);

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
    <div className="glass-card p-4 flex flex-col h-[520px]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-bold">Issue Chats</h3>
          <p className="text-xs text-slate-400">
            Start a new chat for each issue. End chat → create ticket or close.
          </p>
        </div>
        <button type="button" onClick={() => setNewOpen(true)} className="btn-primary px-3 py-2 text-xs">
          + New chat
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <select
          className="select flex-1"
          value={activeId || ""}
          onChange={(e) => setActiveId(e.target.value)}
        >
          {threads.map((t) => (
            <option key={t.id} value={t.id}>
              {t.status === "Closed" ? "(Closed) " : ""}
              {t.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!active || active.status === "Closed"}
          onClick={() => setEndOpen(true)}
          className={!active || active.status === "Closed" ? "btn-outline px-3 py-2 text-xs opacity-50" : "btn-outline px-3 py-2 text-xs"}
        >
          End chat
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-2xl p-3 bg-white/5 border border-white/10 space-y-3">
        {(active?.messages || []).map((m) => (
          <div key={m.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">
                {m.sender} <span className="text-xs text-slate-400">({m.role})</span>
              </p>
              <p className="text-xs text-slate-500">{m.ts}</p>
            </div>
            <p className="text-sm text-slate-200 mt-1">{m.text}</p>
          </div>
        ))}
        {(active?.messages || []).length === 0 && (
          <p className="text-sm text-slate-300">No messages yet.</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder={active?.status === "Closed" ? "Chat is closed" : "Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={!active || active.status === "Closed"}
        />
        <button
          type="button"
          onClick={send}
          disabled={!active || active.status === "Closed"}
          className={!active || active.status === "Closed" ? "btn-primary opacity-40" : "btn-primary"}
        >
          Send
        </button>
      </div>

      {/* Create new chat modal */}
      {newOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md p-5">
            <h4 className="text-lg font-bold">Start new issue chat</h4>
            <p className="text-xs text-slate-400 mt-1">Give this issue a short title.</p>
            <input
              className="input mt-3"
              placeholder="e.g., Bug: Upload stuck at 0%"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setNewOpen(false);
                  setNewTitle("");
                }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button type="button" onClick={createNew} className="btn-primary">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End chat modal */}
      {endOpen && active && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md p-5">
            <h4 className="text-lg font-bold">End this chat?</h4>
            <p className="text-sm text-slate-300 mt-1">
              Issue: <span className="font-semibold">{active.title}</span>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              You can end chat and optionally create a ticket.
            </p>

            <div className="flex flex-col gap-2 mt-4">
              <button type="button" onClick={endAndCreateTicket} className="btn-primary">
                End & Create Ticket
              </button>
              <button type="button" onClick={endChatOnly} className="btn-outline">
                End without Ticket
              </button>
              <button type="button" onClick={() => setEndOpen(false)} className="btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
