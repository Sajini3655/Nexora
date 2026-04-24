import React, { useEffect, useMemo, useState } from "react";
import { Box, Grid, Typography, Chip, MenuItem, Divider } from "@mui/material";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import {
  assignManagerTaskAssignee,
  fetchManagerDevelopers,
  fetchManagerTasks,
  getErrorMessage,
  suggestManagerTaskAssignment,
} from "../../../services/managerService";

export default function AIAssignment() {
  const [developers, setDevelopers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");

  const [suggestion, setSuggestion] = useState(null);
  const [loadingAssignManual, setLoadingAssignManual] = useState(false);
  const [loadingAssignAI, setLoadingAssignAI] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const [developersData, tasksData] = await Promise.all([
        fetchManagerDevelopers(),
        fetchManagerTasks(),
      ]);
      setDevelopers(Array.isArray(developersData) ? developersData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (e) {
      setMsg(getErrorMessage(e, "Failed to load developers or tasks."));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((t) => String(t?.id) === String(selectedTaskId)) || null,
    [tasks, selectedTaskId]
  );

  const canAssignManual = useMemo(
    () => Boolean(selectedTaskId && selectedDeveloperId),
    [selectedTaskId, selectedDeveloperId]
  );

  const canAssignAI = useMemo(
    () => Boolean(selectedTaskId && selectedTask?.title),
    [selectedTaskId, selectedTask]
  );

  const handleAssignManual = async () => {
    if (!canAssignManual) return;

    setMsg("");
    setSuggestion(null);
    setLoadingAssignManual(true);

    try {
      await assignManagerTaskAssignee(Number(selectedTaskId), Number(selectedDeveloperId));
      const dev = developers.find((d) => String(d?.id) === String(selectedDeveloperId));
      setMsg(dev ? `Assigned to ${dev.name}.` : "Task assignment updated.");
      await load();
    } catch (e) {
      setMsg(getErrorMessage(e, "Manual assignment failed."));
    } finally {
      setLoadingAssignManual(false);
    }
  };

  const handleAssignWithAI = async () => {
    if (!canAssignAI || !selectedTask) return;

    setMsg("");
    setSuggestion(null);
    setLoadingAssignAI(true);

    try {
      const data = await suggestManagerTaskAssignment({
        title: selectedTask?.title || "",
        description: selectedTask?.description || "",
        estimatedPoints:
          selectedTask?.estimatedPoints != null
            ? Number(selectedTask.estimatedPoints)
            : null,
      });

      setSuggestion(data);

      const recommendedId = data?.recommendedDeveloper?.id;
      if (!recommendedId) {
        throw new Error("No AI recommendation available for this task.");
      }

      await assignManagerTaskAssignee(Number(selectedTaskId), Number(recommendedId));
      setSelectedDeveloperId(String(recommendedId));
      setMsg(`AI assigned: ${data.recommendedDeveloper.name}.`);
      await load();
    } catch (e) {
      setMsg(getErrorMessage(e, "AI assignment failed."));
    } finally {
      setLoadingAssignAI(false);
    }
  };

  const panelSx = {
    p: 2.8,
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.1)",
    background:
      "linear-gradient(160deg, rgba(255,255,255,0.085), rgba(255,255,255,0.035))",
    backdropFilter: "blur(12px)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
  };

  return (
    <Box
      sx={{
        p: { xs: 0, md: 0.5 },
        background:
          "radial-gradient(850px 320px at 5% -10%, rgba(16,185,129,0.12), transparent 55%), radial-gradient(1000px 360px at 95% -20%, rgba(59,130,246,0.14), transparent 60%)",
        borderRadius: 3,
      }}
    >
      <PageHeader
        title="AI Task Assignment"
        subtitle="Assign developers to existing tasks manually or using AI skill/workload recommendations from backend data."
        right={
          <Chip
            label={`Developers: ${developers.length}`}
            sx={{
              fontWeight: 700,
              color: "#a7f3d0",
              border: "1px solid rgba(16,185,129,0.28)",
              backgroundColor: "rgba(16,185,129,0.12)",
            }}
          />
        }
      />

      <Card sx={panelSx}>
        <Typography sx={{ fontWeight: 950, mb: 1.6, fontSize: 21 }}>
          Assign Developer
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Input
              select
              label="Task"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              <MenuItem value="">Select task</MenuItem>
              {tasks.map((task) => (
                <MenuItem key={task.id} value={String(task.id)}>
                  {task.title}
                </MenuItem>
              ))}
            </Input>
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              select
              label="Developer"
              value={selectedDeveloperId}
              onChange={(e) => setSelectedDeveloperId(e.target.value)}
            >
              <MenuItem value="">Select developer</MenuItem>
              {developers.map((dev) => (
                <MenuItem key={dev.id} value={String(dev.id)}>
                  {dev.name}
                </MenuItem>
              ))}
            </Input>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 1, mt: 1.8, flexWrap: "wrap" }}>
          <Button
            tone="soft"
            loading={loadingAssignAI}
            disabled={!canAssignAI}
            onClick={handleAssignWithAI}
            sx={{ minHeight: 44, px: 2.5, fontWeight: 800 }}
          >
            AI Assign
          </Button>

          <Button
            loading={loadingAssignManual}
            disabled={!canAssignManual}
            onClick={handleAssignManual}
            sx={{ minHeight: 44, px: 2.5, fontWeight: 800 }}
          >
            Assign Manually
          </Button>
        </Box>

        {msg ? (
          <Box
            sx={{
              mt: 1.6,
              px: 1.4,
              py: 0.9,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {msg}
            </Typography>
          </Box>
        ) : null}

        {suggestion?.recommendedDeveloper ? (
          <Box
            sx={{
              mt: 1.6,
              p: 1.4,
              borderRadius: 2,
              border: "1px solid rgba(59,130,246,0.3)",
              background: "rgba(59,130,246,0.1)",
            }}
          >
            <Typography sx={{ fontWeight: 900 }}>
              AI recommendation: {suggestion.recommendedDeveloper.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.4 }}>
              Confidence {suggestion.confidence}% • {suggestion.explanation}
            </Typography>
          </Box>
        ) : null}

        <Divider sx={{ my: 2.2, opacity: 0.35 }} />

        <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Task Queue</Typography>

        {tasks.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            No tasks available.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {tasks.slice(0, 8).map((t) => (
              <Box
                key={t.id}
                sx={{
                  p: 1.6,
                  borderRadius: 2.2,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                  boxShadow: "0 8px 22px rgba(0,0,0,0.14)",
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>{t.title}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.2 }}>
                  Priority: {t.priority || t.taskPriority || "-"} • Status: {t.status || t.taskStatus || "-"}
                  {t.assignedToName ? ` • Assigned: ${t.assignedToName}` : " • Unassigned"}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
}
