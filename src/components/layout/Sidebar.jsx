import React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography
} from "@mui/material";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";

import { Link, useLocation } from "react-router-dom";
import { useLayout } from "../../context/LayoutContext";

const drawerWidth = 268;

function SectionLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{ px: 2, pt: 1.5, pb: 0.75, opacity: 0.65, fontWeight: 800 }}
    >
      {children}
    </Typography>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, closeSidebar } = useLayout();

  const selected = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const itemsCore = [
    { to: "/admin", label: "Dashboard", icon: <AdminPanelSettingsIcon /> },
    { to: "/users", label: "Users", icon: <PeopleIcon /> }
  ];

  const itemsSecurity = [
    { to: "/access", label: "Access Control", icon: <SecurityIcon /> },
    { to: "/settings", label: "System Settings", icon: <SettingsIcon /> }
  ];

  return (
    <Drawer
      open={sidebarOpen}
      onClose={closeSidebar}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      sx={{
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
          borderRight: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(14px)"
        }
      }}
    >
      {/* Brand */}
      <Box sx={{ p: 2.2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
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
              Nexora Admin
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Identity & Control
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      <SectionLabel>CORE</SectionLabel>
      <NavList items={itemsCore} selected={selected} closeSidebar={closeSidebar} />

      <Divider sx={{ my: 1 }} />

      <SectionLabel>SECURITY</SectionLabel>
      <NavList items={itemsSecurity} selected={selected} closeSidebar={closeSidebar} />

      <Box sx={{ mt: "auto", p: 2, opacity: 0.65, fontSize: 12 }}>
        Admin Role • Secure Mode
      </Box>
    </Drawer>
  );
}

function NavList({ items, selected, closeSidebar }) {
  return (
    <List sx={{ px: 1.2, pb: 1 }}>
      {items.map((it) => {
        const isActive = selected(it.to);

        return (
          <ListItemButton
            key={it.to}
            component={Link}
            to={it.to}
            selected={isActive}
            onClick={closeSidebar}
            sx={{
              borderRadius: 2.2,
              mb: 0.6,
              position: "relative",
              overflow: "hidden",

              // active left accent bar
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 8,
                bottom: 8,
                width: 4,
                borderRadius: 99,
                background:
                  "linear-gradient(180deg, rgba(124,92,255,0.95), rgba(124,92,255,0.25))",
                opacity: isActive ? 1 : 0
              },

              "&.Mui-selected": {
                background:
                  "linear-gradient(90deg, rgba(124,92,255,0.22), rgba(124,92,255,0.08))",
                border: "1px solid rgba(124,92,255,0.25)"
              },
              "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, opacity: 0.92 }}>
              {it.icon}
            </ListItemIcon>
            <ListItemText
              primary={it.label}
              primaryTypographyProps={{ fontWeight: 800 }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}
