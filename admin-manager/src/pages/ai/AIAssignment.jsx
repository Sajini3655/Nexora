import React, { useEffect, useMemo, useState } from "react";
import { Box, Grid, Typography, Chip, Divider, MenuItem } from "@mui/material";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import useApi from "../../hooks/useApi.jsx";

const priorityOptions = ["LOW", "MEDIUM", "HIGH"];

export default function AIAssignment() {
  const api = useApi();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [estimatedPoints, setEstimatedPoints] = useState("");

  const [developers, setDevelopers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const [devRes, taskRes] = await Promise.all([
        api.get("/manager/developers"),
        api.get("/manager/tasks"),
      ]);
      setDevelopers(devRes.data || []);
      setTasks(taskRes.data || []);
    } catch (e) {
      console.warn("Load failed", e);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSuggest = useMemo(() => title.trim().length > 0, [title]);

  const handleSuggest = async () => {
    setMsg("");
    setSuggestion(null);
    setLoadingSuggest(true);
    try {
      const res = await api.post("/manager/tasks/suggest", {
        title,
        description,
        estimatedPoints: estimatedPoints ? Number(estimatedPoints) : null,
      });
      setSuggestion(res.data);
    } catch (e) {
      console.error(e);
      setMsg("Suggestion failed. Check backend is running and you are logged in as MANAGER.");
    } finally {
      setLoadingSuggest(false);
    }
  };

  const handleCreate = async () => {
    setMsg("");
    setLoadingCreate(true);
    try {
      const assignedToId = suggestion?.recommendedDeveloper?.id || null;
      await api.post("/manager/tasks", {
        title,
        description,
        priority,
        dueDate: dueDate || null,
        estimatedPoints: estimatedPoints ? Number(estimatedPoints) : null,
        assignedToId,
      });

      setMsg(assignedToId ? "Task created and assigned." : "Task created." );
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      setEstimatedPoints("");
      setSuggestion(null);
      await load();
    } catch (e) {
      console.error(e);
      setMsg("Create task failed.");
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="AI Task Assignment"
        subtitle="Create a task and get a developer recommendation based on skills + workload (demo logic)."
        right={<Chip label={`Developers: ${developers.length}`} />}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 950, mb: 1.5 }}>Create task</Typography>

            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <Input
                  label="Task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Implement login API"
                />
              </Grid>
              <Grid item xs={12}>
                <Input
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details here..."
                  multiline
                  minRows={4}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Input
                  select
                  label="Priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {priorityOptions.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Input>
              </Grid>

              <Grid item xs={12} md={4}>
                <Input
                  label="Due date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Input
                  label="Estimated points"
                  value={estimatedPoints}
                  onChange={(e) => setEstimatedPoints(e.target.value)}
                  placeholder="e.g., 5"
                />
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              <Button
                tone="soft"
                loading={loadingSuggest}
                disabled={!canSuggest}
                onClick={handleSuggest}
              >
                Suggest developer
              </Button>

              <Button
                loading={loadingCreate}
                disabled={!title.trim()}
                onClick={handleCreate}
              >
                Create task {suggestion?.recommendedDeveloper?.id ? "& assign" : ""}
              </Button>

              {msg ? (
                <Typography variant="body2" sx={{ opacity: 0.85, ml: 1 }}>
                  {msg}
                </Typography>
              ) : null}
            </Box>
          </Card>

          {suggestion ? (
            <Card sx={{ p: 2.5, mt: 2.5 }}>
              <Typography sx={{ fontWeight: 950, mb: 1 }}>
                Recommendation
              </Typography>

              {suggestion.recommendedDeveloper ? (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                    <Box>
                      <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                        {suggestion.recommendedDeveloper.name}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.75 }}>
                        {suggestion.recommendedDeveloper.email}
                      </Typography>
                    </Box>

                    <Chip label={`Confidence: ${suggestion.confidence}%`} />
                  </Box>

                  <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.9 }}>
                    {suggestion.explanation}
                  </Typography>

                  <Divider sx={{ my: 2, opacity: 0.35 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Metric label="Skill" value={pct(suggestion.breakdown?.skillScore)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Metric label="Workload" value={pct(suggestion.breakdown?.workloadScore)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Metric label="Experience" value={pct(suggestion.breakdown?.experienceScore)} />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2, opacity: 0.35 }} />

                  <Chips title="Required skills" items={suggestion.requiredSkills} />
                  <Chips title="Matched" items={suggestion.matchedSkills} />
                  <Chips title="Missing" items={suggestion.missingSkills} />
                </Box>
              ) : (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {suggestion.explanation || "No recommendation available."}
                </Typography>
              )}
            </Card>
          ) : null}
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 950, mb: 1.5 }}>Created tasks</Typography>
            {tasks.length === 0 ? (
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                No tasks created yet.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {tasks.map((t) => (
                  <Box
                    key={t.id}
                    sx={{
                      p: 1.6,
                      borderRadius: 2.2,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>{t.title}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.2 }}>
                      Priority: {t.priority} • Status: {t.status}
                      {t.assignedToName ? ` • Assigned: ${t.assignedToName}` : ""}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Metric({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{value}</Typography>
    </Box>
  );
}

function Chips({ title, items }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Box sx={{ mb: 1.4 }}>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>{title}</Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.6 }}>
        {list.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            —
          </Typography>
        ) : (
          list.map((x, idx) => <Chip key={`${title}-${idx}`} size="small" label={x} />)
        )}
      </Box>
    </Box>
  );
}

function pct(v) {
  const n = typeof v === "number" ? v : 0;
  return `${Math.round(n * 100)}%`;
}
