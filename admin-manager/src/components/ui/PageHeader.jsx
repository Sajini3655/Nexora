import React from "react";
import { Box, Typography, Divider } from "@mui/material";

export default function PageHeader({
  title,
  subtitle,
  right,
  compact = false,
  divider = true
}) {
  return (
    <Box sx={{ mb: compact ? 2 : 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap"
        }}
      >
        <Box sx={{ minWidth: 240 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              letterSpacing: -0.35,
              lineHeight: 1.12
            }}
          >
            {title}
          </Typography>

          {/* subtitle removed globally (avoid AI-generated subtitles) */}
        </Box>

        {right ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              ml: "auto"
            }}
          >
            {right}
          </Box>
        ) : null}
      </Box>

      {divider ? (
        <Divider sx={{ mt: compact ? 1.8 : 2.2, opacity: 0.65 }} />
      ) : null}
    </Box>
  );
}

