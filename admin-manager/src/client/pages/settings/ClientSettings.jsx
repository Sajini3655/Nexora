import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

export default function ClientSettings() {
  return (
    <>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Settings
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 0.5 }}>
            Client preferences and account options.
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: "var(--nx-panel)",
            border: "1px solid var(--nx-border)",
            boxShadow: "none",
            maxWidth: 760,
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 1 }}>
            Settings scaffold
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
            Notification preferences, branding options, and report delivery settings can be connected here later.
          </Typography>
        </Paper>
      </Stack>
    </>
  );
}

