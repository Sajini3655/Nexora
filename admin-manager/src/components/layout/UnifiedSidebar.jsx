import React from "react";
import { Box, Drawer, IconButton, Typography } from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { layoutGaps } from "../../theme/layoutGaps.js";

export default function UnifiedSidebar({
  open,
  onClose,
  sections,
  footer,
  width = 292,
}) {
  const topbarClearance = layoutGaps.topbar.topInset + layoutGaps.topbar.height - 64;
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (to) => {
    onClose?.();
    navigate(to);
  };

  const isActivePath = (item) => {
    const pathname = location.pathname || "";

    if (item.end) {
      return pathname === item.to;
    }

    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{
        keepMounted: true,
        sx: {
          top: `${topbarClearance }px`,
          "& .MuiBackdrop-root": {
            top: `${topbarClearance}px`,
          },
        },
      }}
      PaperProps={{
        sx: {
          top: `${topbarClearance}px`,
          left: `${layoutGaps.topbar.sideInset}px`,
          height: `calc(100% - ${topbarClearance}px)`,
          width,
          px: 2,
          pt: 1.2,
          pb: 2,
          color: "#e5e7eb",
          background: "rgba(12,18,32,0.98)",
          borderRight: "1px solid rgba(148,163,184,0.10)",
          boxShadow: "18px 0 44px rgba(0,0,0,0.28)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.4 }}>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            width: 38,
            height: 38,
            color: "#e5e7eb",
            border: "1px solid rgba(148,163,184,0.12)",
            background: "rgba(255,255,255,0.03)",
            "&:hover": {
              background: "rgba(255,255,255,0.06)",
            },
          }}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      </Box>

      {sections.map((section) => (
        <Box key={section.label || "default"} sx={{ mb: 1.1 }}>
          {section.label ? (
            <Typography
              sx={{
                color: "#94a3b8",
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: 0.9,
                textTransform: "uppercase",
                mb: 1,
                px: 1,
              }}
            >
              {section.label}
            </Typography>
          ) : null}

          <Box sx={{ display: "grid", gap: 0.65 }}>
            {section.items.map((item) => (
              <Box
                key={item.to}
                component="button"
                type="button"
                onClick={() => handleItemClick(item.to)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  minHeight: 46,
                  px: 1.35,
                  borderRadius: 2.5,
                  color: "#cbd5e1",
                  textDecoration: "none",
                  fontSize: 14.5,
                  fontWeight: 800,
                  border: "1px solid transparent",
                  transition: "all 160ms ease",
                  cursor: "pointer",
                  textAlign: "left",
                  background: "transparent",
                  appearance: "none",
                  width: "100%",
                  "& svg": { fontSize: 20, color: "#94a3b8" },
                  "&:hover": {
                    color: "#ffffff",
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(148,163,184,0.10)",
                  },
                  ...(isActivePath(item)
                    ? {
                        color: "#ffffff",
                        background: "rgba(255,255,255,0.05)",
                        borderColor: "rgba(91,108,255,0.18)",
                        boxShadow: "none",
                        "& svg": { color: "#dbe4ff" },
                      }
                    : {}),
                }}
              >
                {item.icon ? item.icon : null}
                <Box component="span">{item.label}</Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      {footer ? (
        <Box sx={{ mt: "auto", px: 1, pt: 1.5 }}>
          <Typography sx={{ color: "#64748b", fontSize: 11.5 }}>{footer}</Typography>
        </Box>
      ) : null}
    </Drawer>
  );
}
