import React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getActiveRole } from "../../utils/roleRouting";

function formatTime(value) {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getIconByEventType(eventType) {
  switch (eventType) {
    case "TASK_ASSIGNED":
      return <AssignmentIndRoundedIcon fontSize="small" />;
    case "TICKET_CREATED":
    case "TICKET_ASSIGNED":
      return <ConfirmationNumberRoundedIcon fontSize="small" />;
    case "PROJECT_ASSIGNED":
      return <FolderOpenRoundedIcon fontSize="small" />;
    default:
      return <NotificationsRoundedIcon fontSize="small" />;
  }
}

function buildItemPath(notification, role) {
  const id = notification?.aggregateId;
  const aggregate = String(notification?.aggregateType || "").toUpperCase();

  if (aggregate === "TASK") {
    if (role === "DEVELOPER") return id ? `/dev/tasks/${id}` : "/dev/tasks";
    return id ? `/manager/projects/${id}` : "/manager/projects";
  }

  if (aggregate === "TICKET") {
    if (role === "DEVELOPER") return id ? `/dev/tickets/${id}` : "/dev/tickets";
    if (role === "CLIENT") return "/client/tickets";
    return id ? `/manager/tickets` : "/manager/tickets";
  }

  if (aggregate === "PROJECT") {
    if (role === "CLIENT") return id ? `/client/projects/${id}` : "/client/projects";
    return id ? `/manager/projects/${id}` : "/manager/projects";
  }

  return "/";
}

export default function NotificationCenter({
  anchorEl,
  open,
  onClose,
  notifications = [],
  loading = false,
  error = "",
  markAsRead,
  markAllAsRead,
  removeNotification,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = getActiveRole(user) || user?.role || "MANAGER";

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleOpenItem = (notification) => {
    const path = buildItemPath(notification, role);
    if (path && path !== "/") {
      navigate(path);
    }
    onClose?.();
    if (!notification.read) {
      markAsRead?.(notification.id);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ px: 2, py: 3, minWidth: 320, textAlign: "center" }}>
          <Typography sx={{ color: "var(--nx-muted)" }}>Loading notifications...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ px: 2, py: 3, minWidth: 320, textAlign: "center" }}>
          <Typography sx={{ color: "var(--nx-text)", mb: 1 }}>Unable to load notifications. Please try again.</Typography>
          <Button variant="outlined" size="small" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </Box>
      );
    }

    if (!notifications.length) {
      return (
        <Box sx={{ px: 2, py: 4, minWidth: 320, textAlign: "center" }}>
          <Typography sx={{ color: "var(--nx-muted)" }}>No notifications yet</Typography>
        </Box>
      );
    }

    return (
      <List disablePadding sx={{ width: 380, maxHeight: 520, overflowY: "auto" }}>
        {notifications.map((notification) => {
          const isUnread = !notification.read;
          return (
            <React.Fragment key={notification.id ?? `${notification.eventType}-${notification.createdAt}`}>
              <ListItem disablePadding sx={{ px: 1.2, py: 0.25 }}>
                <ListItemButton
                  disableRipple
                  onClick={() => handleOpenItem(notification)}
                  sx={{
                    display: "block",
                    borderRadius: 2,
                    px: 1.2,
                    py: 1,
                    background: isUnread ? "var(--nx-panel-2)" : "transparent",
                    border: isUnread ? "1px solid var(--nx-border)" : "1px solid transparent",
                    "&:hover": {
                      background: "var(--nx-panel-2)",
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="flex-start">
                    <Box
                      sx={{
                        mt: 0.3,
                        width: 34,
                        height: 34,
                        borderRadius: 2,
                        background: "var(--nx-card)",
                        color: "var(--nx-text)",
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid var(--nx-border)",
                      }}
                    >
                      {getIconByEventType(notification.eventType)}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography sx={{ fontWeight: 800, color: "var(--nx-text)" }} variant="body2">
                          {notification.title || "Notification"}
                        </Typography>
                        {isUnread ? <Chip label="New" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} /> : null}
                      </Stack>

                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.4,
                          color: "var(--nx-muted)",
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {notification.message || "No details available."}
                      </Typography>

                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                          {formatTime(notification.createdAt)}
                        </Typography>

                        <Stack direction="row" spacing={0.5}>
                          {!notification.read ? (
                            <IconButton
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                markAsRead?.(notification.id);
                              }}
                              sx={{ color: "var(--nx-muted)" }}
                              aria-label="Mark notification as read"
                            >
                              <MarkEmailReadRoundedIcon fontSize="small" />
                            </IconButton>
                          ) : null}

                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeNotification?.(notification.id);
                            }}
                            sx={{ color: "var(--nx-muted)" }}
                            aria-label="Delete notification"
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
                </ListItemButton>
              </ListItem>
              <Divider sx={{ borderColor: "var(--nx-border)" }} />
            </React.Fragment>
          );
        })}
      </List>
    );
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            mt: 1.5,
            borderRadius: 3,
            background: "var(--nx-card)",
            border: "1px solid var(--nx-border)",
            boxShadow: "var(--nx-shadow)",
            overflow: "hidden",
            color: "var(--nx-text)",
          },
        },
      }}
    >
      <Box sx={{ minWidth: 380, maxWidth: 420 }}>
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <NotificationsRoundedIcon sx={{ color: "var(--nx-text)" }} fontSize="small" />
            <Typography sx={{ fontWeight: 900, color: "var(--nx-text)" }}>Notifications</Typography>
          </Stack>
          {unreadCount > 0 ? (
            <Button size="small" variant="text" onClick={markAllAsRead} sx={{ color: "var(--nx-text)", textTransform: "none" }}>
              Mark all read
            </Button>
          ) : null}
        </Box>

        <Divider sx={{ borderColor: "var(--nx-border)" }} />
        {renderContent()}
      </Box>
    </Popover>
  );
}
