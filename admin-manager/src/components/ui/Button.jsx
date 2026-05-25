import React from "react";
import { Button as MUIButton, CircularProgress } from "@mui/material";

/**
 * Props:
 * - tone: "primary" | "soft" | "danger"
 * - loading: boolean
 * - variant: MUI variant (contained | outlined | text)
 */
export default function Button({
  children,
  tone = "primary",
  loading = false,
  disabled,
  variant,
  ...props
}) {
  // Decide default variant based on tone
  const resolvedVariant =
    variant ??
    (tone === "soft" ? "outlined" : "contained");

  const color =
    tone === "danger"
      ? "error"
      : tone === "soft"
      ? "primary"
      : "primary";

  return (
    <MUIButton
      {...props}
      variant={resolvedVariant}
      color={color}
      disabled={disabled || loading}
      sx={{
        position: "relative",
        ...(tone === "soft" && {
          backgroundColor: "var(--nx-panel-2)",
          borderColor: "var(--nx-border)",
          color: "var(--nx-text-soft)",
          "&:hover": {
            backgroundColor: "var(--nx-panel)"
          }
        }),
        ...(tone === "danger" && {
          backgroundColor: "var(--nx-red)",
          color: "var(--nx-on-accent)",
          "&:hover": {
            backgroundColor: "color-mix(in srgb, var(--nx-red) 88%, black 12%)"
          }
        }),
        "&.Mui-disabled": {
          color: "var(--nx-muted)",
          borderColor: "var(--nx-border)",
          backgroundColor: "var(--nx-panel-2)",
          opacity: 0.85,
        },
        ...(loading && {
          pointerEvents: "none"
        })
      }}
    >
      {/* Spinner overlay */}
      {loading && (
        <CircularProgress
          size={20}
          sx={{
            color: "inherit",
            position: "absolute"
          }}
        />
      )}

      {/* Hide text while loading (keeps button size) */}
      <span style={{ opacity: loading ? 0 : 1 }}>
        {children}
      </span>
    </MUIButton>
  );
}

