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
        bgcolor: "var(--nx-bg)",
        color: "var(--nx-text)",
      }}
    >
      <ClientTopbar onToggleSidebar={() => setSidebarOpen(true)} />

      {}
      <Box sx={{ height: { xs: "116px", md: "122px" } }} />

      <ClientSidebar
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

