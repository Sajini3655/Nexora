import React from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function AdminLayout({ children, page, setPage }) {
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
      <Sidebar page={page} setPage={setPage} />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Topbar />

        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            px: { xs: 2, md: 3, lg: 4 },
            py: { xs: 2, md: 3 },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "1400px",
              mx: "auto",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}