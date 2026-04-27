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
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Client preferences and account options.
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
            maxWidth: 760,
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 1 }}>
            Settings scaffold
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            Notification preferences, branding options, and report delivery settings can be connected here later.
          </Typography>
        </Paper>
      </Stack>
    </>
  );
}

