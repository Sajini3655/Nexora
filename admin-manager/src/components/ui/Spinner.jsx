import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function Spinner({ label = "Loading...", compact = false }) {
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        gap: 1,
        p: compact ? 2 : 4,
        minHeight: compact ? "auto" : 220
      }}
    >
      <CircularProgress />
      <Typography variant="body2" sx={{ opacity: 0.7 }}>
        {label}
      </Typography>
    </Box>
  );
}
