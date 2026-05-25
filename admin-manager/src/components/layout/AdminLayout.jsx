import React from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import { layoutGaps } from "../../theme/layoutGaps.js";

export default function AdminLayout({ children, page, setPage }) {
  const topbarClearance = layoutGaps.topbar.topInset + layoutGaps.topbar.height;

  return (
    <Box
      className="nx-app-shell"
      sx={{ minHeight: "100vh" }}
    >
      <Topbar />
      <Sidebar page={page} setPage={setPage} />
      <Box sx={{ height: `${topbarClearance}px` }} />
      <Box
        className="nx-main-content"
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
