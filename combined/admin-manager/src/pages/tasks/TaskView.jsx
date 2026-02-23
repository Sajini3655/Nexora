import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Typography, Alert, Stack, Chip } from "@mui/material";
import Card from "../../components/ui/Card.jsx";
import useApi from "../../hooks/useApi";
import { formatDate } from "../../utils/formatDate";

export default function TaskView() {
  const { id } = useParams();
  const api = useApi();

  const [task, setTask] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const res = await api.get(`/api/tasks/${id}`);
        setTask(res.data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load task");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Task #{id}
      </Typography>

      {err ? <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert> : null}

      {task ? (
        <Card>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {task.title}
          </Typography>
          <Typography sx={{ opacity: 0.85, mt: 1 }}>{task.description || "-"}</Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
            <Chip label={`Status: ${task.status}`} />
            <Chip variant="outlined" label={`Priority: ${task.priority}`} />
            <Chip variant="outlined" label={`Due: ${formatDate(task.dueDate)}`} />
          </Stack>
        </Card>
      ) : null}
    </>
  );
}
