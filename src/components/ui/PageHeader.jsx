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
              fontWeight: 950,
              letterSpacing: -0.6,
              lineHeight: 1.15
            }}
          >
            {title}
          </Typography>

          {subtitle ? (
            <Typography
              variant="body2"
              sx={{
                mt: 0.7,
                opacity: 0.75,
                maxWidth: 860
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
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
        <Divider sx={{ mt: compact ? 2 : 2.5, opacity: 0.8 }} />
      ) : null}
    </Box>
  );
}
