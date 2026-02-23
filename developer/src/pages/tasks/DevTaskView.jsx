import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DevLayout from "../../components/layout/DevLayout";
import { currentProject } from "../../data/devWorkspaceMock";
import { loadTasks, updateTask } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";
import {
  fetchSubtasks,
  createSubtask,
  updateSubtask as patchSubtask,
  deleteSubtask as removeSubtaskApi,
} from "../../data/subtaskApi";

function calcPoints(subtasks) {
  const total = subtasks.reduce((s, x) => s + Number(x.points || 0), 0);
  const done = subtasks
    .filter((x) => x.done)
    .reduce((s, x) => s + Number(x.points || 0), 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

function mapBackendSubtasks(list) {
  if (!Array.isArray(list)) return [];
  return list.map((s) => ({
    id: String(s.id),
    title: s.title,
    points: Number(s.points || 0),
    done: !!s.done,
  }));
}

function ProgressBar({ pct }) {
  return (
    <div className="h-2 bg-white/10 rounded-full mt-3">
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

export default function DevTaskView() {
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newPoints, setNewPoints] = useState("");

  // Always sync from backend then resolve the task.
  // (Avoid stale local cache causing /subtasks 404s.)
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      await syncAssignedTasksToLocalStoreSafe();
      const found = loadTasks().find((t) => String(t.id) === String(id)) || null;
      if (!alive) return;
      setTask(found);
      setLoading(false);
    };
    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // When the task changes, refresh subtask state from local store.
  useEffect(() => {
    if (task) setSubtasks(Array.isArray(task.subtasks) ? task.subtasks : []);
  }, [task?.id]);

  // Pull subtasks from backend for this task (source of truth).
  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!task?.id) return;
      try {
        const list = await fetchSubtasks(task.id);
        const mapped = mapBackendSubtasks(list);
        if (!alive) return;
        setSubtasks(mapped);
        // cache in local store for workspace preview
        updateTask(String(task.id), (t) => ({ ...t, subtasks: mapped }));
      } catch {
        // ignore; fallback to local cache
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [task?.id]);

  if (loading) {
    return (
      <DevLayout>
        <p className="text-slate-300">Loading task…</p>
      </DevLayout>
    );
  }

  if (!task) {
    return (
      <DevLayout>
        <h2 className="text-2xl font-bold mb-3">Task not found</h2>
        <Link to={`/project/${currentProject.id}`} className="btn-outline inline-flex">
          Back to Project Workspace
        </Link>
      </DevLayout>
    );
  }

  const progress = calcPoints(subtasks);

  const addSubtask = () => {
    const title = newTitle.trim();
    const pts = Number(newPoints);

    if (!title) return;
    if (!Number.isFinite(pts) || pts <= 0) return;

    (async () => {
      try {
        await createSubtask(task.id, { title, points: pts });
        const list = await fetchSubtasks(task.id);
        const mapped = mapBackendSubtasks(list);
        setSubtasks(mapped);
        updateTask(String(task.id), (t) => ({ ...t, subtasks: mapped }));
        await syncAssignedTasksToLocalStoreSafe();
        const found = loadTasks().find((t) => String(t.id) === String(id)) || null;
        setTask(found);
        setNewTitle("");
        setNewPoints("");
      } catch {
        // ignore
      }
    })();
  };

  const toggleDone = (subId) => {
    (async () => {
      const current = subtasks.find((s) => String(s.id) === String(subId));
      if (!current) return;
      try {
        await patchSubtask(task.id, subId, { done: !current.done });
        const list = await fetchSubtasks(task.id);
        const mapped = mapBackendSubtasks(list);
        setSubtasks(mapped);
        updateTask(String(task.id), (t) => ({ ...t, subtasks: mapped }));
        await syncAssignedTasksToLocalStoreSafe();
        const found = loadTasks().find((t) => String(t.id) === String(id)) || null;
        setTask(found);
      } catch {
        // ignore
      }
    })();
  };

  const removeSubtask = (subId) => {
    (async () => {
      try {
        await removeSubtaskApi(task.id, subId);
        const list = await fetchSubtasks(task.id);
        const mapped = mapBackendSubtasks(list);
        setSubtasks(mapped);
        updateTask(String(task.id), (t) => ({ ...t, subtasks: mapped }));
        await syncAssignedTasksToLocalStoreSafe();
        const found = loadTasks().find((t) => String(t.id) === String(id)) || null;
        setTask(found);
      } catch {
        // ignore
      }
    })();
  };

  return (
    <DevLayout>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">Task Details</p>
          <h2 className="text-2xl font-bold truncate">{task.title}</h2>

          <p className="text-sm text-slate-300 mt-2">
            <span className="chip-muted mr-2">{task.id}</span>
            <span className="chip-muted mr-2">Status: {task.status}</span>
            <span className="chip-muted mr-2">Assignee: {task.assignee}</span>
            <span className="chip-muted mr-2">Due: {task.dueDate}</span>
            <span className="chip-muted">Priority: {task.priority}</span>
          </p>

          {task.description && (
            <p className="text-sm text-slate-200 mt-4">{task.description}</p>
          )}

          <p className="text-xs text-slate-400 mt-2">
            Subtasks and story points are saved in the backend and used to calculate task progress.
          </p>
        </div>

        <Link to={`/project/${currentProject.id}`} className="btn-outline">
          Back
        </Link>
      </div>

      {/* Progress */}
      <div className="glass-card p-4 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Progress (Story Points)</h3>
          <div className="text-sm font-semibold">
            {progress.pct}% ({progress.done}/{progress.total})
          </div>
        </div>
        <ProgressBar pct={progress.pct} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Subtasks list */}
        <div className="lg:col-span-2 glass-card p-4">
          <h3 className="text-lg font-bold mb-3">Subtasks</h3>

          <div className="space-y-2">
            {subtasks.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-start justify-between"
              >
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={!!s.done}
                    onChange={() => toggleDone(s.id)}
                    className="mt-1 accent-violet-500"
                  />
                  <div>
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-slate-400">{s.points} story points</p>
                  </div>
                </div>

                <button type="button" onClick={() => removeSubtask(s.id)} className="btn-outline px-3 py-1.5 text-xs">
                  Remove
                </button>
              </div>
            ))}

            {subtasks.length === 0 && (
              <p className="text-sm text-slate-300">No subtasks yet. Add one below.</p>
            )}
          </div>
        </div>

        {/* Add subtask */}
        <div className="glass-card p-4">
          <h3 className="text-lg font-bold mb-3">Create Subtask</h3>

          <label className="text-xs text-slate-400">Title</label>
          <input
            className="input mt-1"
            placeholder="e.g., Create API endpoint"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <label className="text-xs text-slate-400 mt-3 block">Story Points</label>
          <input
            className="input mt-1"
            placeholder="e.g., 3"
            value={newPoints}
            onChange={(e) => setNewPoints(e.target.value)}
            inputMode="numeric"
          />

          <button type="button" onClick={addSubtask} className="mt-4 w-full btn-primary">
            Add Subtask
          </button>

          <p className="text-xs text-slate-400 mt-3">
            Story points are used to calculate task progress in real-time.
          </p>
        </div>
      </div>
    </DevLayout>
  );
}
