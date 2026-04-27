import React, { useState } from "react";
import { Box } from "@mui/material";
import DevSidebar from "./DevSidebar";
import Topbar from "../../../components/layout/Topbar.jsx";
import { layoutGaps } from "../../../theme/layoutGaps.js";

export default function DevLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const topbarClearance = layoutGaps.topbar.topInset + layoutGaps.topbar.height;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(104,81,255,0.18), transparent 24%), radial-gradient(circle at top right, rgba(0,255,170,0.10), transparent 22%), linear-gradient(180deg, #07101f 0%, #040a15 100%)",
        color: "#e7e9ee",
      }}
    >
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <DevSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box sx={{ height: `${topbarClearance}px` }} />
      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: `${layoutGaps.maxContentWidth}px`,
          mx: "auto",
          pt: layoutGaps.contentTopGap,
          px: `${layoutGaps.adminManager.side}px`,
          pb: `${layoutGaps.adminManager.bottom}px`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
