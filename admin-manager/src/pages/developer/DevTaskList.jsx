import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

import { loadTasks } from "../../dev/data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../dev/data/taskApi";

export default function DevTaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(() => loadTasks());
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const merged = await syncAssignedTasksToLocalStoreSafe();
      if (alive) setTasks(merged);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tasks;
    return tasks.filter((t) =>
      `${t.id} ${t.title} ${t.assignee} ${t.status} ${t.priority}`.toLowerCase().includes(s)
    );
  }, [tasks, q]);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Tasks
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.72, mt: 0.6 }}>
            Assigned tasks and local progress (subtasks/story points).
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/developer/project/P-001")}>Go to Workspace</Button>
      </Box>

      <Card>
        <Input
          label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks..."
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
          {rows.map((t) => (
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
                    {t.id} • {t.status} • {t.priority} • Due {t.dueDate}
                  </Typography>
                </Box>
                <Chip size="small" label={t.assignee || "You"} variant="outlined" />
              </Box>
            </Card>
          ))}
          {rows.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              No tasks found.
            </Typography>
          ) : null}
        </Box>
      </Card>
    </Box>
  );
}
