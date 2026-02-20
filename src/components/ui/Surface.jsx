import React from "react";
import { Box } from "@mui/material";

export default function Surface({ children, sx }) {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        ...sx
      }}
    >
      {children}
    </Box>
  );
}
