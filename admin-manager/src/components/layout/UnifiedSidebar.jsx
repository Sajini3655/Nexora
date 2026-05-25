import React, { useEffect, useRef } from "react";
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
  const topbarClearance = layoutGaps.topbar.topInset + layoutGaps.topbar.height;
  const navigate = useNavigate();
  const location = useLocation();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();
  }, [open]);

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
        container: () => document.body,
        sx: {
          top: `${topbarClearance}px`,
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
          color: "var(--nx-text)",
          background: "var(--nx-panel)",
          borderRight: "1px solid var(--nx-border)",
          boxShadow: "var(--nx-shadow)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.4 }}>
        <IconButton
          ref={closeButtonRef}
          onClick={onClose}
          size="small"
          sx={{
            width: 38,
            height: 38,
            color: "var(--nx-text)",
            border: "1px solid var(--nx-border)",
            background: "var(--nx-panel-2)",
            "&:hover": {
              background: "var(--nx-card)",
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
                color: "var(--nx-muted)",
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
                  color: "var(--nx-text-soft)",
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
                  "& svg": { fontSize: 20, color: "var(--nx-muted)" },
                  "&:hover": {
                    color: "var(--nx-text)",
                    background: "var(--nx-panel-2)",
                    borderColor: "var(--nx-border)",
                  },
                  ...(isActivePath(item)
                    ? {
                        color: "var(--nx-text)",
                        background: "var(--nx-panel-2)",
                        borderColor: "var(--nx-border-strong)",
                        boxShadow: "none",
                        "& svg": { color: "var(--nx-blue)" },
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
          <Typography sx={{ color: "var(--nx-muted)", fontSize: 11.5 }}>{footer}</Typography>
        </Box>
      ) : null}
    </Drawer>
  );
}
