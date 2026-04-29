import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

export default function ClientHistory() {
  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            History
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            View completed projects and resolved tickets.
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "rgba(15,23,42,0.72)",
            border: "1px solid rgba(148,163,184,0.16)",
            color: "#e5e7eb",
          }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1 }}>
            No history records yet
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            Completed projects and resolved tickets will appear here.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}