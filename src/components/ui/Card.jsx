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
        // More contrast (so it won't look "blank")
        backgroundColor: "rgba(15,18,35,0.72)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
        ...sx
      }}
    >
      {children}
    </Paper>
  );
}
