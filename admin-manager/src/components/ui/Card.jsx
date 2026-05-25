import React from "react";
import { Paper } from "@mui/material";

export default function Card({ children, sx, ...props }) {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={{
        p: 2.25,
        borderRadius: "22px",
        background: "var(--nx-card)",
        border: "1px solid var(--nx-border)",
        boxShadow: "var(--nx-shadow)",
        transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: "var(--nx-border-strong)",
        },
        ...sx
      }}
    >
      {children}
    </Paper>
  );
}

