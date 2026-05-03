import React from "react";
import { Paper } from "@mui/material";

export default function Card({ children, sx, ...props }) {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={{
        p: 2.25,
        borderRadius: 3,
        background: "rgba(15,23,42,0.74)",
        border: "1px solid rgba(148,163,184,0.12)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
        backdropFilter: "blur(12px)",
        transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: "rgba(91,108,255,0.20)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
        },
        ...sx
      }}
    >
      {children}
    </Paper>
  );
}

