import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import Card from "../../../components/ui/Card";
import ProgressBar from "./ProgressBar";
import StoryPointChecklist from "./StoryPointChecklist";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";

function getStatusLabel(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "COMPLETED" || normalized === "DONE") return "Completed";
  if (normalized === "IN_PROGRESS") return "In Progress";
  if (normalized === "BLOCKED") return "Blocked";
  return "Todo";
}

export default function TaskProgressCard({
  task,
  progress,
  storyPoints,
  loadingStoryPoints,
  storyPointError,
  togglingStoryPointId,
  onToggleStoryPoint,
}) {
  return (
    <Card sx={{ p: 2.2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.2, alignItems: "flex-start" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
            {task.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.3 }}>
            Project: {task.projectName || "Unlinked"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            Due: {task.dueDate || "-"} • Priority: {task.priority || "MEDIUM"}
          </Typography>
        </Box>

        <StatusBadge label={getStatusLabel(progress?.status || task?.status)} />
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <ProgressBar value={progress?.progressPercentage || 0} />
        <Typography variant="caption" sx={{ color: "#94a3b8", mt: 0.8, display: "block" }}>
          Story Points: {progress?.completedStoryPoints || 0} / {progress?.totalStoryPoints || 0} completed
        </Typography>
        <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
          Weighted: {progress?.completedPointValue || 0} / {progress?.totalPointValue || 0} points
        </Typography>
      </Box>

      <Box sx={{ mt: 1.4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#e2e8f0" }}>
          Story Points
        </Typography>
        <StoryPointChecklist
          storyPoints={storyPoints}
          loading={loadingStoryPoints}
          error={storyPointError}
          togglingId={togglingStoryPointId}
          onToggle={onToggleStoryPoint}
        />
      </Box>
    </Card>
  );
}



