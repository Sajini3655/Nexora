import React from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import { layoutGaps } from "../../theme/layoutGaps.js";

export default function AdminLayout({ children, page, setPage }) {
  const topbarClearance = layoutGaps.topbar.topInset + layoutGaps.topbar.height;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(104,81,255,0.18), transparent 22%), radial-gradient(circle at top right, rgba(0,255,170,0.08), transparent 18%), linear-gradient(180deg, #08101f 0%, #050b18 100%)",
        color: "#e7e9ee",
      }}
    >
      <Topbar />
      <Sidebar page={page} setPage={setPage} />
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
