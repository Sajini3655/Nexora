import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

export default function ProgressBar({ value = 0 }) {
  const normalized = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
          Progress
        </Typography>
        <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 800 }}>
          {normalized}%
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={normalized}
        sx={{
          height: 8,
          borderRadius: 999,
          bgcolor: "rgba(255,255,255,0.08)",
          "& .MuiLinearProgress-bar": {
            bgcolor: normalized === 100 ? "#22c55e" : "#60a5fa",
          },
        }}
      />
    </Box>
  );
}

