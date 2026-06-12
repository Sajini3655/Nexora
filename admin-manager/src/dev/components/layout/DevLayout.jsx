import React, { useState } from "react";
import { Box } from "@mui/material";
import DevSidebar from "./DevSidebar";
import Topbar from "../../../components/layout/Topbar.jsx";

export default function DevLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--nx-app)",
        color: "var(--nx-text)",
      }}
    >
      <Topbar
        onMenuClick={() => setSidebarOpen(true)}
        workspace="Developer Workspace"
      />

      {}
      <Box sx={{ height: { xs: "112px", md: "116px" } }} />

      <DevSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: "none",
          mx: 0,
          pt: 2,
          px: {
            xs: 2,
            sm: 3,
            md: 5,
          },
          pb: { xs: 3, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

