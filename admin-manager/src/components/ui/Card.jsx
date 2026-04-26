import React from "react";
import { Paper } from "@mui/material";

export default function Card({ children, sx, ...props }) {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={{
        p: 2.5,
        borderRadius: 4,
        background:
          "linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(11,18,32,0.88) 100%)",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 22px 70px rgba(0,0,0,0.38)",
        backdropFilter: "blur(14px)",
        transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(124,92,255,0.28)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.46)",
        },
        ...sx
      }}
    >
      {children}
    </Paper>
  );
}
