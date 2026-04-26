import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const links = [
  { to: "/client", label: "Dashboard" },
  { to: "/client/tickets", label: "Tickets" },
  { to: "/client/projects", label: "Workstreams" },
];

export default function ClientSidebar({ open, onClose }) {
  const location = useLocation();

  const selected = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": {
          width: 260,
          boxSizing: "border-box",
          bgcolor: "#0b1628",
          color: "#e5e7eb",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        },
      }}
    >
      <Box sx={{ height: "100%", p: 2, position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            px: 0.5,
            py: 0.5,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
              Nexora
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              Client Workspace
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "#cbd5e1",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

        <List sx={{ p: 0 }}>
          {links.map((item) => {
            const active = selected(item.to);

            return (
              <ListItemButton
                key={item.to}
                component={Link}
                to={item.to}
                onClick={onClose}
                sx={{
                  mb: 0.7,
                  borderRadius: 2,
                  py: 1.15,
                  px: 1.4,
                  color: active ? "#ffffff" : "#cbd5e1",
                  bgcolor: active ? "rgba(124,92,255,0.18)" : "transparent",
                  border: active
                    ? "1px solid rgba(124,92,255,0.35)"
                    : "1px solid transparent",
                  "&:hover": {
                    bgcolor: active
                      ? "rgba(124,92,255,0.24)"
                      : "rgba(255,255,255,0.05)",
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: active ? 800 : 600,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ position: "absolute", bottom: 18, left: 18, right: 18 }}>
          <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Profile is available from the topbar.
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
