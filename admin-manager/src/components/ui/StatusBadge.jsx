import React from "react";
import { Box } from "@mui/material";

const variants = {
  success: {
    color: "var(--nx-green)",
    bg: "color-mix(in srgb, var(--nx-green) 12%, transparent)",
    border: "color-mix(in srgb, var(--nx-green) 22%, transparent)",
  },
  info: {
    color: "var(--nx-blue)",
    bg: "color-mix(in srgb, var(--nx-blue) 12%, transparent)",
    border: "color-mix(in srgb, var(--nx-blue) 22%, transparent)",
  },
  warning: {
    color: "var(--nx-yellow)",
    bg: "color-mix(in srgb, var(--nx-yellow) 12%, transparent)",
    border: "color-mix(in srgb, var(--nx-yellow) 22%, transparent)",
  },
  danger: {
    color: "var(--nx-red)",
    bg: "color-mix(in srgb, var(--nx-red) 12%, transparent)",
    border: "color-mix(in srgb, var(--nx-red) 22%, transparent)",
  },
  purple: {
    color: "var(--nx-purple)",
    bg: "color-mix(in srgb, var(--nx-purple) 12%, transparent)",
    border: "color-mix(in srgb, var(--nx-purple) 22%, transparent)",
  },
  neutral: {
    color: "var(--nx-muted)",
    bg: "color-mix(in srgb, var(--nx-muted) 10%, transparent)",
    border: "color-mix(in srgb, var(--nx-muted) 18%, transparent)",
  },
};

export function badgeVariant(value) {
  const text = String(value || "").trim().toLowerCase();

  if (["done", "completed", "complete", "resolved", "closed", "enabled", "ok", "up", "live", "success"].includes(text)) {
    return "success";
  }

  if (["active", "open", "new", "planning", "low", "info"].includes(text)) {
    return "info";
  }

  if (["todo", "in_progress", "in progress", "pending", "review", "medium", "assigned", "check"].includes(text)) {
    return "warning";
  }

  if (["high", "critical", "blocked", "blocker", "failed", "down", "disabled", "error", "danger"].includes(text)) {
    return "danger";
  }

  if (["admin", "manager", "developer", "client", "ai", "role"].includes(text)) {
    return "purple";
  }

  return "neutral";
}

export default function StatusBadge({ label, variant, size = "small", sx = {} }) {
  const selected = variants[variant || badgeVariant(label)] || variants.neutral;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: size === "medium" ? 28 : 24,
        px: size === "medium" ? 1.35 : 1.05,
        borderRadius: 999,
        fontSize: size === "medium" ? 11 : 10,
        lineHeight: 1,
        fontWeight: 800,
        letterSpacing: 0.25,
        textTransform: "uppercase",
        color: selected.color,
        backgroundColor: selected.bg,
        border: `1px solid ${selected.border}`,
        whiteSpace: "nowrap",
        ...sx,
      }}
    >
      {label || "-"}
    </Box>
  );
}
