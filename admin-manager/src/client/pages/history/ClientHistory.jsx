import React, { useEffect, useState } from "react";
import { Box, Paper, Stack, Typography, Skeleton } from "@mui/material";
import { API_BASE_URL } from "../../../utils/constants";

export default function ClientHistory() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = window.localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${API_BASE_URL}/api/client/history`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const data = await response.json();
      setActivities(data || []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setError("Unable to load project history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      PROJECT_CREATED: "📋",
      PROJECT_UPDATED: "✏️",
      CLIENT_ASSIGNED: "👤",
      MANAGER_ASSIGNED: "👨‍💼",
      TASK_CREATED: "✅",
      TASK_ASSIGNED: "📌",
      TASK_COMPLETED: "✓",
      TICKET_CREATED: "🎫",
      TICKET_STATUS_CHANGED: "🔄",
      TICKET_RESOLVED: "✓",
      TICKET_CLOSED: "🔒",
    };
    return icons[activityType] || "📝";
  };

  if (loading) {
    return (
      <Box>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              History
            </Typography>
          </Box>
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Paper
                key={i}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "var(--nx-card)",
                  border: "1px solid var(--nx-border)",
                }}
              >
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="60%" sx={{ mt: 1 }} />
                <Skeleton variant="text" width="30%" sx={{ mt: 1 }} />
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              History
            </Typography>
          </Box>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "var(--nx-card)",
              border: "1px solid var(--nx-border)",
              color: "var(--nx-text)",
              boxShadow: "var(--nx-shadow)",
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 1, color: "error.main" }}>
              {error}
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
              Please try refreshing the page.
            </Typography>
          </Paper>
        </Stack>
      </Box>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Box>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              History
            </Typography>
          </Box>

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "var(--nx-card)",
              border: "1px solid var(--nx-border)",
              color: "var(--nx-text)",
              boxShadow: "var(--nx-shadow)",
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 1 }}>
              No history records yet
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
              Project activities will appear here as they occur.
            </Typography>
          </Paper>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            History
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 1 }}>
            {activities.length} activities recorded
          </Typography>
        </Box>

        <Stack spacing={2}>
          {activities.map((activity) => (
            <Paper
              key={activity.id}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "var(--nx-card)",
                border: "1px solid var(--nx-border)",
                color: "var(--nx-text)",
                boxShadow: "var(--nx-shadow)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "var(--nx-shadow)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    fontSize: "1.5rem",
                    mt: 0.5,
                    flexShrink: 0,
                  }}
                >
                  {getActivityIcon(activity.activityType)}
                </Box>
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                        {activity.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--nx-muted)",
                          mb: 1,
                          wordBreak: "break-word",
                        }}
                      >
                        {activity.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: "rgba(99, 115, 129, 0.12)",
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1,
                        color: "var(--nx-muted)",
                      }}
                    >
                      {activity.activityType.replace(/_/g, " ")}
                    </Typography>
                    {activity.projectName && (
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: "rgba(33, 150, 243, 0.12)",
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1,
                          color: "var(--nx-muted)",
                        }}
                      >
                        {activity.projectName}
                      </Typography>
                    )}
                    {activity.performedBy && (
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: "rgba(76, 175, 80, 0.12)",
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1,
                          color: "var(--nx-muted)",
                        }}
                      >
                        By: {activity.performedBy}
                      </Typography>
                    )}
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--nx-muted)",
                      mt: 1.5,
                      fontSize: "0.75rem",
                    }}
                  >
                    {formatDate(activity.createdAt)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}