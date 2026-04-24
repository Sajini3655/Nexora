import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography
} from "@mui/material";

const links = [
  { to: "/client", label: "Dashboard" },
  { to: "/client/projects", label: "Projects" },
  { to: "/client/tickets", label: "Tickets" },
  { to: "/client/profile", label: "Profile" },
  { to: "/client/settings", label: "Settings" }
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
          width: 268,
          boxSizing: "border-box",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
          borderRight: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(14px)",
          color: "#e7e9ee"
        }
      }}
    >
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          p: 2,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 0.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2.2,
              background:
                "linear-gradient(135deg, rgba(124,92,255,0.95), rgba(124,92,255,0.35))",
              boxShadow: "0 14px 40px rgba(124,92,255,0.20)",
              border: "1px solid rgba(255,255,255,0.18)"
            }}
          />
          <Box>
            <Typography sx={{ fontWeight: 950, letterSpacing: -0.4 }}>
              Nexora Client
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Projects & Support
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />

        <Box component="nav">
          <List sx={{ p: 0 }}>
            {links.map((item) => {
              const isActive = selected(item.to);

              return (
                <ListItemButton
                  key={item.to}
                  component={Link}
                  to={item.to}
                  selected={isActive}
                  onClick={onClose}
                  sx={{
                    borderRadius: 2,
                    mb: 0.75,
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: isActive
                      ? "rgba(124,92,255,0.22)"
                      : "rgba(255,255,255,0.04)",
                    background: isActive
                      ? "linear-gradient(90deg, rgba(124,92,255,0.22), rgba(124,92,255,0.08))"
                      : "transparent",
                    color: isActive ? "#fff" : "rgba(231,233,238,0.92)",
                    boxShadow: isActive ? "0 12px 30px rgba(124,92,255,0.12)" : "none",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" }
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: 0.2,
                      mr: 1.5,
                      flexShrink: 0
                    }}
                  >
                    {item.label.slice(0, 2).toUpperCase()}
                  </Box>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 800 }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        <Box sx={{ mt: "auto", pt: 2 }}>
          <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />
          <Typography variant="caption" sx={{ opacity: 0.65 }}>
            Client Space
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
