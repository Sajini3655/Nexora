import React, { useState } from "react";
import { Alert, Badge, IconButton, Snackbar } from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import NotificationCenter from "./NotificationCenter.jsx";
import useNotifications from "../../hooks/useNotifications.jsx";

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    toast,
    setToast,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={(event) => setAnchorEl((current) => (current ? null : event.currentTarget))}
        sx={{
          width: 42,
          height: 42,
          color: "var(--nx-text)",
          border: "1px solid var(--nx-border)",
          background: "var(--nx-panel-2)",
          borderRadius: "50%",
          "&:hover": {
            background: "var(--nx-card)",
            borderColor: "var(--nx-border-strong)",
          },
        }}
        aria-label="Notifications"
      >
        <Badge
          badgeContent={unreadCount > 99 ? "99+" : unreadCount}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              minWidth: 18,
              height: 18,
              fontSize: 10,
              fontWeight: 800,
              borderRadius: 999,
            },
          }}
          invisible={unreadCount === 0}
        >
          <NotificationsNoneRoundedIcon />
        </Badge>
      </IconButton>

      <NotificationCenter
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        notifications={notifications}
        loading={loading}
        error={error}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
        removeNotification={removeNotification}
      />

      {toast ? (
        <Snackbar
          open={Boolean(toast)}
          autoHideDuration={5200}
          onClose={() => setToast(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setToast(null)}
            severity={toast.eventType ? "info" : "success"}
            sx={{ width: "100%", border: "1px solid var(--nx-border)" }}
          >
            <strong>{toast.title}</strong>
            <div>{toast.message}</div>
          </Alert>
        </Snackbar>
      ) : null}
    </>
  );
}
