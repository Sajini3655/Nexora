import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

const links = [
  { to: "/client", label: "Dashboard", short: "DA" },
  { to: "/client/projects", label: "Projects", short: "PR" },
  { to: "/client/tickets", label: "Tickets", short: "TI" },
  { to: "/client/history", label: "History", short: "HI" },
  { to: "/client/timesheets", label: "Timesheets", short: "TS" },
  { to: "/client/profile", label: "Profile", short: "PF" },
  { to: "/client/settings", label: "Settings", short: "SE" },
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
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(2, 6, 23, 0.58)",
          backdropFilter: "blur(4px)",
        },
        "& .MuiDrawer-paper": {
          width: { xs: 292, sm: 318 },
          top: "0 !important",
          height: "100vh !important",
          boxSizing: "border-box",
          color: "#e7e9ee",
          borderRight: "1px solid rgba(148, 163, 184, 0.18)",
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(7, 14, 29, 0.98))",
          backdropFilter: "blur(22px) saturate(150%)",
          WebkitBackdropFilter: "blur(22px) saturate(150%)",
          boxShadow:
            "28px 0 80px rgba(0,0,0,0.42), inset -1px 0 0 rgba(255,255,255,0.04)",
        },
      }}
    >
      <Box
        sx={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          px: 2.2,
          py: 2.4,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            top: -60,
            left: -50,
            background: "rgba(124,92,255,0.18)",
            filter: "blur(35px)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            bottom: 80,
            right: -70,
            background: "rgba(96,165,250,0.13)",
            filter: "blur(34px)",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          {/* Brand block */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.45,
              p: 1.4,
              borderRadius: "22px",
              border: "1px solid rgba(255,255,255,0.10)",
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "18px",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                position: "relative",
                background:
                  "conic-gradient(from 180deg, #7c5cff, #60a5fa, #22d3ee, #7c5cff)",
                boxShadow:
                  "0 14px 38px rgba(96,165,250,0.20), 0 10px 28px rgba(124,92,255,0.26)",
                border: "1px solid rgba(255,255,255,0.20)",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 6,
                  borderRadius: "13px",
                  background:
                    "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.42), transparent 26%), linear-gradient(135deg, rgba(15,23,42,0.18), rgba(15,23,42,0.46))",
                },
              }}
            >
              <Typography
                sx={{
                  position: "relative",
                  zIndex: 1,
                  fontWeight: 950,
                  fontSize: 17,
                  color: "#ffffff",
                  letterSpacing: -0.6,
                }}
              >
                N
              </Typography>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 950,
                  fontSize: 17,
                  lineHeight: 1,
                  letterSpacing: -0.55,
                  color: "#f8fafc",
                }}
              >
                Nexora Client
              </Typography>

              <Typography
                sx={{
                  mt: 0.55,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "rgba(203,213,225,0.62)",
                }}
              >
                Projects & Support
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.09)" }} />

          {/* Navigation */}
          <Box component="nav">
            <Typography
              sx={{
                px: 1,
                mb: 1,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: "rgba(148,163,184,0.72)",
              }}
            >
              Navigation
            </Typography>

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
                      minHeight: 54,
                      borderRadius: "18px",
                      mb: 0.85,
                      px: 1.15,
                      position: "relative",
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: isActive
                        ? "rgba(167,139,250,0.36)"
                        : "rgba(255,255,255,0.065)",
                      background: isActive
                        ? "linear-gradient(135deg, rgba(124,92,255,0.30), rgba(96,165,250,0.13))"
                        : "rgba(255,255,255,0.025)",
                      color: isActive ? "#ffffff" : "rgba(231,233,238,0.86)",
                      boxShadow: isActive
                        ? "0 16px 36px rgba(124,92,255,0.18), inset 0 1px 0 rgba(255,255,255,0.08)"
                        : "none",
                      transition:
                        "background 160ms ease, border-color 160ms ease, transform 160ms ease",
                      "&:hover": {
                        background: isActive
                          ? "linear-gradient(135deg, rgba(124,92,255,0.36), rgba(96,165,250,0.16))"
                          : "rgba(255,255,255,0.065)",
                        borderColor: "rgba(167,139,250,0.30)",
                        transform: "translateX(3px)",
                      },
                      "&.Mui-selected": {
                        background:
                          "linear-gradient(135deg, rgba(124,92,255,0.30), rgba(96,165,250,0.13))",
                      },
                      "&.Mui-selected:hover": {
                        background:
                          "linear-gradient(135deg, rgba(124,92,255,0.36), rgba(96,165,250,0.16))",
                      },
                      "&::before": isActive
                        ? {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "18%",
                            bottom: "18%",
                            width: 4,
                            borderRadius: "999px",
                            background:
                              "linear-gradient(180deg, #7c5cff, #60a5fa)",
                          }
                        : {},
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 1.45,
                        flexShrink: 0,
                        fontSize: 12,
                        fontWeight: 950,
                        letterSpacing: 0.2,
                        color: isActive ? "#ffffff" : "rgba(226,232,240,0.78)",
                        border: "1px solid",
                        borderColor: isActive
                          ? "rgba(255,255,255,0.20)"
                          : "rgba(255,255,255,0.08)",
                        background: isActive
                          ? "linear-gradient(135deg, rgba(124,92,255,0.55), rgba(96,165,250,0.24))"
                          : "rgba(255,255,255,0.055)",
                        boxShadow: isActive
                          ? "0 10px 24px rgba(124,92,255,0.20)"
                          : "none",
                      }}
                    >
                      {item.short}
                    </Box>

                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: isActive ? 950 : 850,
                        letterSpacing: -0.1,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        </Box>

        {/* Bottom info */}
        <Box
          sx={{
            mt: "auto",
            pt: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.09)" }} />

          <Box
            sx={{
              p: 1.5,
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.035)",
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 900,
                color: "#f8fafc",
              }}
            >
              Client Space
            </Typography>

            <Typography
              sx={{
                mt: 0.35,
                fontSize: 11.5,
                color: "rgba(203,213,225,0.62)",
                lineHeight: 1.45,
              }}
            >
              Manage workstreams, tickets, history, and profile details.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}