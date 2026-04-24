import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiUser, FiMessageCircle } from "react-icons/fi";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography
} from "@mui/material";

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

export default function DevSidebar({ open, onClose }) {
  const menuItems = [
    { name: "Dashboard", icon: <FiHome />, path: "/dev" },
    { name: "Profile", icon: <FiUser />, path: "/dev/profile" },
    { name: "Chat", icon: <FiMessageCircle />, path: "/dev/chat" }
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
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
              Nexora Dev
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Developer Workspace
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      <SectionLabel>CORE</SectionLabel>
      <List sx={{ px: 1.2, pb: 1 }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/dev"}
            onClick={onClose}
            style={({ isActive }) => ({ textDecoration: "none" })}
          >
            {({ isActive }) => (
              <ListItemButton
                selected={isActive}
                sx={{
                  borderRadius: 2.2,
                  mb: 0.6,
                  position: "relative",
                  overflow: "hidden",
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
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{ fontWeight: 800 }}
                />
              </ListItemButton>
            )}
          </NavLink>
        ))}
      </List>

      <Box sx={{ mt: "auto", p: 2, opacity: 0.65, fontSize: 12 }}>
        Developer Role • Workspace Mode
      </Box>
    </Drawer>
  );
}