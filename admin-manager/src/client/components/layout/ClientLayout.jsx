import React, { useState } from "react";
import { Box } from "@mui/material";
import ClientSidebar from "./ClientSidebar";
import ClientTopbar from "./ClientTopbar";

export default function ClientLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(104,81,255,0.18), transparent 22%), radial-gradient(circle at top right, rgba(0,255,170,0.08), transparent 18%), linear-gradient(180deg, #08101f 0%, #050b18 100%)",
        color: "#e7e9ee"
      }}
    >
      <ClientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 0 }}>
          <ClientTopbar
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
          />
        </Box>

        <Box
          component="main"
          sx={{
            p: { xs: 1.5, md: 2 },
            flexGrow: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <Box
            sx={{
              background: "rgba(15,20,40,0.5)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              p: { xs: 2, md: 2.5 },
              height: "100%",
              overflowY: "auto",
              flexGrow: 1
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
