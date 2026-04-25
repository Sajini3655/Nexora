import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiMessageCircle, FiFolder } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const drawerWidth = 260;

export default function DevSidebar({ open, onClose }) {
  const { moduleAccess } = useAuth();

  const menuItems = [
    ...(moduleAccess?.DASHBOARD
      ? [{ name: "Dashboard", icon: <FiHome />, path: "/dev" }]
      : []),
    { name: "Projects", icon: <FiFolder />, path: "/dev/projects" },
    ...(moduleAccess?.CHAT
      ? [{ name: "Chat", icon: <FiMessageCircle />, path: "/dev/chat" }]
      : []),
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
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
              Developer Workspace
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
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/dev"}
              onClick={onClose}
              style={{ textDecoration: "none" }}
            >
              {({ isActive }) => (
                <ListItemButton
                  selected={isActive}
                  sx={{
                    mb: 0.7,
                    borderRadius: 2,
                    py: 1.15,
                    px: 1.4,
                    color: isActive ? "#ffffff" : "#cbd5e1",
                    bgcolor: isActive ? "rgba(124,92,255,0.18)" : "transparent",
                    border: isActive
                      ? "1px solid rgba(124,92,255,0.35)"
                      : "1px solid transparent",
                    "&:hover": {
                      bgcolor: isActive
                        ? "rgba(124,92,255,0.24)"
                        : "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? "#ffffff" : "#94a3b8",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 800 : 600,
                    }}
                  />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>

        <Box sx={{ position: "absolute", bottom: 18, left: 18, right: 18 }}>
          <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Tasks are available inside projects.
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
