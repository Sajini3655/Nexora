import React, { useState } from "react";
import { Box, Toolbar, Container } from "@mui/material";
import ManagerSidebar from "./ManagerSidebar";
import ManagerTopbar from "./ManagerTopbar";
import Surface from "../ui/Surface";

export default function ManagerShell({ children }) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen(!open);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <ManagerSidebar open={open} onClose={() => setOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <ManagerTopbar onMenuClick={handleToggle} />
        <Toolbar sx={{ minHeight: 72 }} />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Surface>{children}</Surface>
        </Container>
      </Box>
    </Box>
  );
}
