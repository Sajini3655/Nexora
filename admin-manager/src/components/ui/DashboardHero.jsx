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
                width: 46,
                height: 46,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#ddd6fe",
                background:
                  "radial-gradient(circle at 35% 30%, rgba(124,92,255,0.72), rgba(88,28,135,0.35) 68%, rgba(15,23,42,0.32))",
                border: "1px solid rgba(167,139,250,0.38)",
                boxShadow:
                  "0 0 0 6px rgba(124,92,255,0.08), 0 18px 38px rgba(0,0,0,0.25)",
                flex: "0 0 auto",
                "& svg": {
                  fontSize: 25,
                },
              }}
            >
              {icon}
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 950,
                letterSpacing: -0.9,
                color: "#f8fafc",
                lineHeight: 1.05,
              }}
            >
              {title}
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            sx={{
              color: "#94a3b8",
              fontSize: 15,
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
              height: 52,
              px: 2.4,
              borderRadius: 2.4,
              textTransform: "none",
              fontWeight: 900,
              color: "#f8fafc",
              borderColor: "rgba(148,163,184,0.22)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.78), rgba(30,41,59,0.58))",
              boxShadow: "0 14px 34px rgba(0,0,0,0.24)",
              "&:hover": {
                borderColor: "rgba(124,92,255,0.58)",
                background:
                  "linear-gradient(135deg, rgba(124,92,255,0.26), rgba(56,189,248,0.13))",
                boxShadow: "0 18px 42px rgba(124,92,255,0.18)",
              },
            }}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Stack>

      <Box
        sx={{
          mt: 1.45,
          height: 2,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(124,92,255,0.46) 0%, rgba(56,189,248,0.36) 42%, rgba(20,184,166,0.16) 72%, transparent 100%)",
          boxShadow: "0 0 18px rgba(56,189,248,0.14)",
        }}
      />
    </Box>
  );
}
