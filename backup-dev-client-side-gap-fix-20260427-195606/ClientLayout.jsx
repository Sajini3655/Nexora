import React, { useState } from "react";
import { Box } from "@mui/material";
import ClientSidebar from "./ClientSidebar";
import ClientTopbar from "./ClientTopbar";
import { layoutGaps } from "../../../theme/layoutGaps.js";

export default function ClientLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const topbarClearance = layoutGaps.topbar.topInset + layoutGaps.topbar.height;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#07111f",
        color: "#e5e7eb",
      }}
    >
      <ClientTopbar onToggleSidebar={() => setSidebarOpen(true)} />
      <ClientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box sx={{ height: `${topbarClearance}px` }} />
      <Box
        component="main"
        sx={{
          pt: layoutGaps.contentTopGap,
          px: `${layoutGaps.adminManager.side}px`,
          pb: `${layoutGaps.adminManager.bottom}px`,
          maxWidth: `${layoutGaps.maxContentWidth}px`,
          width: "100%",
          mx: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
