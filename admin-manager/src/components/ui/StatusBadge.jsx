import React from "react";
import { Box } from "@mui/material";

const variants = {
  success: {
    color: "#bbf7d0",
    bg: "rgba(34,197,94,0.09)",
    border: "rgba(34,197,94,0.20)",
  },
  info: {
    color: "#bfdbfe",
    bg: "rgba(96,165,250,0.09)",
    border: "rgba(96,165,250,0.20)",
  },
  warning: {
    color: "#fde68a",
    bg: "rgba(245,158,11,0.09)",
    border: "rgba(245,158,11,0.20)",
  },
  danger: {
    color: "#fecaca",
    bg: "rgba(239,68,68,0.09)",
    border: "rgba(239,68,68,0.20)",
  },
  purple: {
    color: "#ddd6fe",
    bg: "rgba(91,108,255,0.10)",
    border: "rgba(91,108,255,0.22)",
  },
  neutral: {
    color: "#cbd5e1",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.18)",
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
