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
    <Box sx={{ mb: 2.4 }}>
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
                color: "#e2e8f0",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(148,163,184,0.12)",
                boxShadow: "none",
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
                color: "#f8fafc",
                lineHeight: 1.08,
              }}
            >
              {title}
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            sx={{
              color: "#94a3b8",
              fontSize: 14,
              maxWidth: 720,
            }}
          >
            {subtitle}
          </Typography>
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
              color: "#f8fafc",
              borderColor: "rgba(148,163,184,0.14)",
              background: "rgba(255,255,255,0.025)",
              boxShadow: "none",
              "&:hover": {
                borderColor: "rgba(148,163,184,0.20)",
                background: "rgba(255,255,255,0.05)",
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
          background: "linear-gradient(90deg, rgba(148,163,184,0.20) 0%, rgba(148,163,184,0.06) 100%)",
        }}
      />
    </Box>
  );
}
