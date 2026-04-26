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
        bgcolor: "#07111f",
        color: "#e5e7eb",
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
          p: { xs: 2, md: 3 },
          maxWidth: "1350px",
          width: "100%",
          mx: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
