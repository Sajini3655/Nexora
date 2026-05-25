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
        </Box>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "var(--nx-card)",
            border: "1px solid var(--nx-border)",
            color: "var(--nx-text)",
            boxShadow: "var(--nx-shadow)",
          }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1 }}>
            No history records yet
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
            Completed projects and resolved tickets will appear here.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}