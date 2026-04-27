import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Activity,
  BriefcaseBusiness,
  Clock3,
  Code2,
  Database,
  HeartPulse,
  Mail,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { getAdminDashboard, getSystemHealth } from "../../../services/api";
import useLiveRefresh from "../../../hooks/useLiveRefresh";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetching = useRef(false);

  const loadDashboard = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;

    try {
      const [dashboardData, healthData] = await Promise.all([
        getAdminDashboard(),
        getSystemHealth(),
      ]);

      setStats(dashboardData?.stats ?? {});
      setRecentUsers(dashboardData?.recentUsers ?? []);
      setSystemHealth(healthData ?? {});
      setError("");
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const liveTopics = useMemo(
    () => [
      "/topic/admin.dashboard",
      "/topic/users",
      "/topic/tickets",
      "/topic/tasks",
      "/topic/system-health",
    ],
    []
  );

  useLiveRefresh(liveTopics, loadDashboard, { debounceMs: 500 });

  const roleCards = useMemo(() => {
    return [
      {
        title: "Admins",
        value: stats?.admins ?? 0,
        icon: <ShieldCheck size={18} />,
      },
      {
        title: "Managers",
        value: stats?.managers ?? 0,
        icon: <BriefcaseBusiness size={18} />,
      },
      {
        title: "Developers",
        value: stats?.developers ?? 0,
        icon: <Code2 size={18} />,
      },
      {
        title: "Clients",
        value: stats?.clients ?? 0,
        icon: <UserRound size={18} />,
      },
    ];
  }, [stats]);

  const healthCards = useMemo(() => {
    return [
      {
        title: "API",
        value: systemHealth?.apiStatus ?? "-",
        icon: <Activity size={18} />,
        badge: systemHealth?.apiStatus === "OK" ? "LIVE" : "CHECK",
        badgeTone: systemHealth?.apiStatus === "OK" ? "success" : "warning",
      },
      {
        title: "Database",
        value: formatDatabaseValue(
          systemHealth?.databaseStatus,
          systemHealth?.databaseLatencyMs
        ),
        icon: <Database size={18} />,
        badge: systemHealth?.databaseStatus === "OK" ? "LIVE" : "CHECK",
        badgeTone: systemHealth?.databaseStatus === "OK" ? "success" : "warning",
      },
      {
        title: "Mail",
        value: systemHealth?.mailStatus ?? "-",
        icon: <Mail size={18} />,
        badge: systemHealth?.mailStatus === "OK" ? "LIVE" : "CHECK",
        badgeTone: systemHealth?.mailStatus === "OK" ? "success" : "warning",
      },
      {
        title: "AI Service",
        value: systemHealth?.aiServiceStatus ?? "-",
        icon: <Activity size={18} />,
        badge: systemHealth?.aiServiceStatus === "OK" ? "LIVE" : "CHECK",
        badgeTone: systemHealth?.aiServiceStatus === "OK" ? "success" : "warning",
      },
      {
        title: "Uptime",
        value: systemHealth?.uptime ?? "-",
        icon: <Clock3 size={18} />,
        badge: "INFO",
        badgeTone: "info",
      },
      {
        title: "Overall",
        value: systemHealth?.overallStatus ?? "-",
        icon: <HeartPulse size={18} />,
        badge: systemHealth?.overallStatus === "UP" ? "OK" : "CHECK",
        badgeTone: systemHealth?.overallStatus === "UP" ? "success" : "warning",
      },
    ];
  }, [systemHealth]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: "#6d5dfc" }} />
          <Typography sx={{ color: "#94a3b8" }}>
            Loading dashboard...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          borderRadius: 3,
          backgroundColor: "rgba(239,68,68,0.10)",
          border: "1px solid rgba(239,68,68,0.20)",
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Overview of users, roles, and live system health.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        <SummaryCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={<Users size={20} />}
        />

        <SummaryCard
          title="Enabled Users"
          value={stats?.enabledUsers ?? 0}
          icon={<UserCheck size={20} />}
          badge="Active"
          badgeTone="success"
        />

        <SummaryCard
          title="Disabled Users"
          value={stats?.disabledUsers ?? 0}
          icon={<UserX size={20} />}
          badge="Review"
          badgeTone="warning"
        />

        <SummaryCard
          title="Pending Invites"
          value={stats?.pendingInvites ?? 0}
          icon={<Mail size={20} />}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
        <SectionCard title="User Roles" subtitle="Current backend role counts">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 1.5,
            }}
          >
            {roleCards.map((item) => (
              <SmallInfoCard
                key={item.title}
                title={item.title}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </Box>
        </SectionCard>

        <SectionCard
          title="System Health"
          subtitle={`Overall status: ${systemHealth?.overallStatus ?? "-"}`}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 1.5,
            }}
          >
            {healthCards.map((item) => (
              <SmallInfoCard
                key={item.title}
                title={item.title}
                value={item.value}
                icon={item.icon}
                badge={item.badge}
                badgeTone={item.badgeTone}
              />
            ))}
          </Box>
        </SectionCard>
      </Box>

      <SectionCard title="Recent Users" subtitle="Latest registered users">
        <Box sx={{ overflowX: "auto" }}>
          <Table
            sx={{
              minWidth: 760,
              borderCollapse: "separate",
              borderSpacing: "0 10px",
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>Name</TableCell>
                <TableCell sx={headCell}>Email</TableCell>
                <TableCell sx={headCell}>Role</TableCell>
                <TableCell sx={headCell}>Status</TableCell>
                <TableCell sx={headCell}>Created</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {recentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: "#94a3b8" }}>
                    No recent users found.
                  </TableCell>
                </TableRow>
              ) : (
                recentUsers.slice(0, 8).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell sx={tableCellLeft}>
                      {user.name || "-"}
                    </TableCell>

                    <TableCell sx={tableCellMid}>
                      {user.email || "-"}
                    </TableCell>

                    <TableCell sx={tableCellMid}>
                      <Badge label={user.role || "-"} tone={getRoleTone(user.role)} />
                    </TableCell>

                    <TableCell sx={tableCellMid}>
                      <Badge
                        label={user.enabled ? "Enabled" : "Disabled"}
                        tone={user.enabled ? "success" : "danger"}
                      />
                    </TableCell>

                    <TableCell sx={tableCellRight}>
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>
    </Stack>
  );
}

function SummaryCard({ title, value, icon, badge, badgeTone = "neutral" }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "#0b1628",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "none",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#94a3b8", fontWeight: 700 }}
          >
            {title}
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.8 }}>
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(124,92,255,0.14)",
            color: "#c4b5fd",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {icon}
        </Box>
      </Box>

      {badge ? (
        <Badge label={badge} tone={badgeTone} sx={{ mt: 1.5 }} />
      ) : null}
    </Paper>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: 3,
        bgcolor: "#0b1628",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "none",
      }}
    >
      <Box sx={{ mb: 1.8 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
          {title}
        </Typography>

        <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.4 }}>
          {subtitle}
        </Typography>
      </Box>

      {children}
    </Paper>
  );
}

function SmallInfoCard({ title, value, icon, badge, badgeTone = "neutral" }) {
  return (
    <Box
      sx={{
        p: 1.6,
        borderRadius: 2,
        bgcolor: "#0f1b2f",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(124,92,255,0.14)",
            color: "#c4b5fd",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: "#94a3b8", fontWeight: 700 }}
          >
            {title}
          </Typography>

          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            {value}
          </Typography>
        </Box>
      </Box>

      {badge ? (
        <Badge label={badge} tone={badgeTone} sx={{ mt: 1.2 }} />
      ) : null}
    </Box>
  );
}

function Badge({ label, tone = "neutral", sx = {} }) {
  const styles = getBadgeStyles(tone);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "fit-content",
        height: 26,
        px: 1.3,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        ...styles,
        ...sx,
      }}
    >
      {label}
    </Box>
  );
}

function getBadgeStyles(tone) {
  switch (tone) {
    case "success":
      return {
        backgroundColor: "rgba(34,197,94,0.20)",
        color: "#86efac",
        border: "1px solid rgba(34,197,94,0.42)",
      };

    case "warning":
      return {
        backgroundColor: "rgba(245,158,11,0.22)",
        color: "#fcd34d",
        border: "1px solid rgba(245,158,11,0.45)",
      };

    case "danger":
      return {
        backgroundColor: "rgba(239,68,68,0.22)",
        color: "#fca5a5",
        border: "1px solid rgba(239,68,68,0.45)",
      };

    case "purple":
      return {
        backgroundColor: "rgba(124,92,255,0.24)",
        color: "#ddd6fe",
        border: "1px solid rgba(124,92,255,0.45)",
      };

    case "blue":
      return {
        backgroundColor: "rgba(59,130,246,0.22)",
        color: "#93c5fd",
        border: "1px solid rgba(59,130,246,0.45)",
      };

    case "info":
      return {
        backgroundColor: "rgba(6,182,212,0.20)",
        color: "#67e8f9",
        border: "1px solid rgba(6,182,212,0.42)",
      };

    default:
      return {
        backgroundColor: "rgba(148,163,184,0.18)",
        color: "#e5e7eb",
        border: "1px solid rgba(148,163,184,0.32)",
      };
  }
}

function getRoleTone(role) {
  const normalized = String(role || "").toUpperCase();

  if (normalized === "ADMIN") return "purple";
  if (normalized === "MANAGER") return "blue";
  if (normalized === "DEVELOPER") return "info";
  if (normalized === "CLIENT") return "success";

  return "neutral";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDatabaseValue(status, latencyMs) {
  if (!status) return "-";
  if (latencyMs == null) return status;
  return `${status} (${latencyMs} ms)`;
}

const headCell = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const tableCellBase = {
  background: "#0f1b2f",
  borderBottom: "none",
  color: "#e5e7eb",
};

const tableCellLeft = {
  ...tableCellBase,
  borderTopLeftRadius: 14,
  borderBottomLeftRadius: 14,
  fontWeight: 700,
};

const tableCellMid = {
  ...tableCellBase,
};

const tableCellRight = {
  ...tableCellBase,
  borderTopRightRadius: 14,
  borderBottomRightRadius: 14,
  color: "#94a3b8",
};
