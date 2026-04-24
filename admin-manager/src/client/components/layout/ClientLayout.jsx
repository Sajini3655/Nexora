import React, { useState } from "react";
import { Box } from "@mui/material";
import ClientSidebar from "./ClientSidebar";
import ClientTopbar from "./ClientTopbar";

export default function ClientLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(104,81,255,0.18), transparent 22%), radial-gradient(circle at top right, rgba(0,255,170,0.08), transparent 18%), linear-gradient(180deg, #08101f 0%, #050b18 100%)",
        color: "#e7e9ee",
      }}
    >
      <ClientSidebar collapsed={collapsed} />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <Box sx={{ p: 2, pb: 0 }}>
          <Box
            sx={{
              background: "rgba(15,20,40,0.7)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              px: 2,
              py: 1.5,
            }}
          >
            <ClientTopbar
              collapsed={collapsed}
              onToggleSidebar={() => setCollapsed((v) => !v)}
            />
          </Box>
        </Box>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            p: 2,
            flexGrow: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
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
              flexGrow: 1,
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
