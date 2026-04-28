import React, { useState } from "react";
import { Box } from "@mui/material";
import ClientSidebar from "./ClientSidebar";
import ClientTopbar from "./ClientTopbar";

export default function ClientLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#07111f",
        color: "#e5e7eb",
      }}
    >
      {!sidebarOpen && (
        <ClientTopbar onToggleSidebar={handleToggleSidebar} />
      )}

      {/* Space for fixed topbar only when topbar is visible */}
      {!sidebarOpen && <Box sx={{ height: { xs: "116px", md: "122px" } }} />}

      <ClientSidebar open={sidebarOpen} onClose={handleCloseSidebar} />

      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: "1180px",
          mx: "auto",
          pt: sidebarOpen ? { xs: 3, md: 4 } : 2,
          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          pb: { xs: 3, md: 4 },
          transition: "padding-top 180ms ease",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}