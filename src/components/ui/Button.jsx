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
          backgroundColor: "rgba(124,92,255,0.12)",
          borderColor: "rgba(124,92,255,0.35)",
          "&:hover": {
            backgroundColor: "rgba(124,92,255,0.22)"
          }
        }),
        ...(tone === "danger" && {
          backgroundColor: "rgba(239,68,68,0.9)",
          "&:hover": {
            backgroundColor: "rgba(220,38,38,1)"
          }
        }),
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
