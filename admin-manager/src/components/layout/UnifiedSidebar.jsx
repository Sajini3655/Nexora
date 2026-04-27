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
          background:
            "linear-gradient(180deg, rgba(29,34,58,0.98) 0%, rgba(12,18,32,0.99) 100%)",
          borderRight: "1px solid rgba(148,163,184,0.14)",
          boxShadow: "22px 0 80px rgba(0,0,0,0.50)",
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
            border: "1px solid rgba(148,163,184,0.16)",
            background: "rgba(255,255,255,0.04)",
            "&:hover": {
              background: "rgba(255,255,255,0.08)",
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
                fontWeight: 950,
                fontSize: 11.5,
                letterSpacing: 1,
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
                  fontWeight: 850,
                  border: "1px solid transparent",
                  transition: "all 160ms ease",
                  cursor: "pointer",
                  textAlign: "left",
                  background: "transparent",
                  appearance: "none",
                  width: "100%",
                  "& svg": { fontSize: 21, color: "#94a3b8" },
                  "&:hover": {
                    color: "#ffffff",
                    background: "rgba(255,255,255,0.055)",
                    borderColor: "rgba(148,163,184,0.14)",
                  },
                  ...(isActivePath(item)
                    ? {
                        color: "#ffffff",
                        background:
                          "linear-gradient(135deg, rgba(124,92,255,0.30), rgba(124,92,255,0.15))",
                        borderColor: "rgba(167,139,250,0.26)",
                        boxShadow: "0 12px 30px rgba(124,92,255,0.14)",
                        "& svg": { color: "#c4b5fd" },
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
          <Typography sx={{ color: "#64748b", fontSize: 12 }}>{footer}</Typography>
        </Box>
      ) : null}
    </Drawer>
  );
}
