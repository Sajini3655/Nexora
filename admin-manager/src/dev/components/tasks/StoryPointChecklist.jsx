import React from "react";
import { Alert, Box, Checkbox, CircularProgress, Stack, Typography } from "@mui/material";

function normalizeStatus(status) {
  return String(status || "").toUpperCase() === "DONE";
}

export default function StoryPointChecklist({
  storyPoints = [],
  loading = false,
  error = "",
  togglingId = null,
  onToggle,
}) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Loading story points...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="warning" sx={{ mt: 1 }}>{error}</Alert>;
  }

  if (!storyPoints.length) {
    return (
      <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>
        No story points added yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      {storyPoints.map((storyPoint) => {
        const isDone = normalizeStatus(storyPoint.status);
        const isToggling = String(togglingId) === String(storyPoint.id);

        return (
          <Box
            key={storyPoint.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 0.7,
              borderRadius: 2,
              bgcolor: "#0f1b2f",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Checkbox
              size="small"
              checked={isDone}
              disabled={isToggling}
              onChange={() => onToggle?.(storyPoint)}
            />

            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#e2e8f0",
                  textDecoration: isDone ? "line-through" : "none",
                  opacity: isDone ? 0.75 : 1,
                }}
              >
                {storyPoint.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                {isDone ? "Done" : "Todo"} • {storyPoint.pointValue || 1} pt
              </Typography>
            </Box>

            {isToggling ? <CircularProgress size={14} /> : null}
          </Box>
        );
      })}
    </Stack>
  );
}

