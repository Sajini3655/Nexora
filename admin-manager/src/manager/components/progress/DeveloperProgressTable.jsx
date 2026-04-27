import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

function rowKey(row, index) {
  return String(row?.developerId ?? row?.id ?? index);
}

export default function DeveloperProgressTable({ rows = [] }) {
  if (!rows.length) {
    return (
      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
        No developer progress data yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: 760 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 0.8fr 1fr 1fr 0.9fr",
            gap: 1,
            pb: 1,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {[
            "Developer",
            "Assigned Tasks",
            "Story Points Done",
            "Weighted Points",
            "Average Progress",
          ].map((header) => (
            <Typography key={header} variant="caption" sx={{ color: "#64748b", fontWeight: 900, textTransform: "uppercase" }}>
              {header}
            </Typography>
          ))}
        </Box>

        {rows.map((row, index) => (
          <Box
            key={rowKey(row, index)}
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 0.8fr 1fr 1fr 0.9fr",
              gap: 1,
              alignItems: "center",
              py: 1.2,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>{row.developerName || row.name || "Unknown"}</Typography>
            <Typography sx={{ color: "#cbd5e1" }}>{row.assignedTasks || 0}</Typography>
            <Typography sx={{ color: "#cbd5e1" }}>
              {row.completedStoryPoints || 0} / {row.totalStoryPoints || 0}
            </Typography>
            <Typography sx={{ color: "#cbd5e1" }}>
              {row.completedPointValue || 0} / {row.totalPointValue || 0}
            </Typography>
            <Box sx={{ pr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Number(row.averageProgress || 0)}
                sx={{
                  height: 7,
                  borderRadius: 999,
                  bgcolor: "rgba(255,255,255,0.08)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "#60a5fa",
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                {Number(row.averageProgress || 0)}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

