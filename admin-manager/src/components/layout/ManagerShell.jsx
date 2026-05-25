import React, { useState } from "react";
import { Box } from "@mui/material";
import ManagerSidebar from "./ManagerSidebar";
import Topbar from "./Topbar";
import { layoutGaps } from "../../theme/layoutGaps.js";

export default function ManagerShell({ children }) {
  const [open, setOpen] = useState(false);
  const topbarClearance = layoutGaps.topbar.topInset + layoutGaps.topbar.height;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--nx-bg)",
        color: "var(--nx-text)",
      }}
    >
      <Topbar onMenuClick={() => setOpen((p) => !p)} />
      <ManagerSidebar open={open} onClose={() => setOpen(false)} />
      <Box sx={{ height: `${topbarClearance}px` }} />
      <Box
        sx={{
          pt: layoutGaps.contentTopGap,
          px: `${layoutGaps.adminManager.side}px`,
          pb: `${layoutGaps.adminManager.bottom}px`,
          maxWidth: `${layoutGaps.maxContentWidth}px`,
          mx: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
