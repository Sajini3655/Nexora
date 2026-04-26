import React, { useState } from "react";
import { Box } from "@mui/material";
import DevSidebar from "./DevSidebar";
import DevTopbar from "./DevTopbar";

export default function DevLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#050b16",
        color: "#e5e7eb",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top left, rgba(109,93,252,0.18), transparent 28%), radial-gradient(circle at top right, rgba(20,184,166,0.12), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%)",
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.12,
          pointerEvents: "none",
        },
      }}
    >
      <DevTopbar onToggleSidebar={() => setSidebarOpen(true)} />

      <DevSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <Box
        component="main"
        sx={{
          position: "relative",
          zIndex: 1,
          p: { xs: 2, md: 3, lg: 4 },
          maxWidth: "1400px",
          width: "100%",
          mx: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
