import React from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function AdminLayout({ children, page, setPage }) {
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar page={page} setPage={setPage} />
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <Topbar />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
