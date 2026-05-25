import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

function rowKey(row, index) {
  return String(row?.developerId ?? row?.id ?? index);
}

export default function DeveloperProgressTable({ rows = [] }) {
  const visibleRows = rows.filter((row) => Number(row.assignedTasks ?? 0) > 0);

  if (!visibleRows.length) {
    return (
      <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
        No developer task progress yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: 760, p: 0.5, borderRadius: 'var(--nx-radius-section)', background: 'var(--nx-card)', border: '1px solid var(--nx-border)' }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "22% 16% 20% 20% 22%",
            gap: 1,
            pb: 1,
            alignItems: "center",
            px: 1,
            borderBottom: "1px solid var(--nx-border)",
            background: 'var(--nx-panel-2)'
          }}
        >
          {[
            "Developer",
            "Assigned Tasks",
            "Story Points Done",
            "Weighted Points",
            "Average Progress",
          ].map((header) => (
            <Typography
              key={header}
              variant="caption"
              sx={{ fontSize: "0.75rem", color: "var(--nx-muted)", fontWeight: 900, textTransform: "uppercase" }}
            >
              {header}
            </Typography>
          ))}
        </Box>

        {visibleRows.map((row, index) => (
          <Box
            key={rowKey(row, index)}
            sx={{
              display: "grid",
              gridTemplateColumns: "22% 16% 20% 20% 22%",
              gap: 1,
              alignItems: "center",
              height: 52,
              px: 1,
              bgcolor: 'transparent',
              borderBottom: '1px solid var(--nx-border)',
              '&:hover': { bgcolor: 'var(--nx-panel-2)' },
            }}
          >
            <Typography sx={{ fontWeight: 800, color: 'var(--nx-text)', fontSize: '0.9rem' }}>{row.developerName || row.name || "Unknown"}</Typography>
            <Typography sx={{ color: "var(--nx-text)", fontSize: '0.9rem' }}>{row.assignedTasks || 0}</Typography>
            <Typography sx={{ color: "var(--nx-text)", fontSize: '0.9rem' }}>
              {row.completedStoryPoints || 0} / {row.totalStoryPoints || 0}
            </Typography>
            <Typography sx={{ color: "var(--nx-text)", fontSize: '0.9rem' }}>
              {row.completedPointValue || 0} / {row.totalPointValue || 0}
            </Typography>
            <Box sx={{ pr: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ maxWidth: 220, width: '100%' }}>
                <LinearProgress
                  variant="determinate"
                  value={Number(row.averageProgress || 0)}
                  sx={{
                    height: 'var(--nx-progress-height,7px)',
                    borderRadius: 'var(--nx-radius-inner)',
                    bgcolor: 'var(--nx-border)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'var(--nx-blue)',
                    },
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: "var(--nx-muted)", fontSize: '0.75rem' }}>
                {Number(row.averageProgress || 0)}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

