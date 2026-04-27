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
        background:
          "radial-gradient(circle at top left, rgba(104,81,255,0.18), transparent 24%), radial-gradient(circle at top right, rgba(0,255,170,0.10), transparent 22%), linear-gradient(180deg, #07101f 0%, #040a15 100%)",
        color: "#e7e9ee",
      }}
    >
      <Topbar
        onMenuClick={() => setSidebarOpen(true)}
        workspace="Developer Workspace"
      />

      {/* Real spacer for fixed topbar */}
      <Box sx={{ height: { xs: "116px", md: "122px" } }} />

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
