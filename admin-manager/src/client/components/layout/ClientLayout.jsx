import React, { useState } from "react";
import { Box } from "@mui/material";
import ClientSidebar from "./ClientSidebar";
import ClientTopbar from "./ClientTopbar";

export default function ClientLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#07111f",
        color: "#e5e7eb",
      }}
    >
      <ClientTopbar onToggleSidebar={() => setSidebarOpen(true)} />

      <ClientSidebar
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
