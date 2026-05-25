import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

export default function DashboardHero({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionTo,
  component,
}) {
  const buttonProps = component && actionTo ? { component, to: actionTo } : {};

  return (
    <Box sx={{ mb: 2.4, color: "var(--nx-text)" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.6}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.4} sx={{ mb: 0.55 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "var(--nx-text)",
                background: "var(--nx-panel-2)",
                border: "1px solid var(--nx-border)",
                boxShadow: "var(--nx-shadow)",
                flex: "0 0 auto",
                "& svg": {
                  fontSize: 22,
                },
              }}
            >
              {icon}
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                letterSpacing: -0.35,
                color: "var(--nx-text)",
                lineHeight: 1.08,
              }}
            >
              {title}
            </Typography>
          </Stack>

          {/* subtitle removed globally (avoid AI-generated subtitles) */}
        </Box>

        {actionLabel ? (
          <Button
            variant="outlined"
            onClick={onAction}
            {...buttonProps}
            sx={{
              minWidth: 148,
              height: 44,
              px: 2.4,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 850,
                color: "var(--nx-text)",
                borderColor: "var(--nx-border)",
                background: "var(--nx-panel)",
              boxShadow: "none",
              "&:hover": {
                  borderColor: "var(--nx-border-strong)",
                  background: "var(--nx-panel-2)",
                boxShadow: "none",
              },
            }}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Stack>

      <Box
        sx={{
          mt: 1.2,
          height: 1,
          borderRadius: 999,
          background: "var(--nx-border)",
        }}
      />
    </Box>
  );
}
