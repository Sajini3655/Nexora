import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
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
      console.error(err);
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
        good: systemHealth?.apiStatus === "OK",
      },
      {
        title: "Database",
        value: formatDatabaseValue(
          systemHealth?.databaseStatus,
          systemHealth?.databaseLatencyMs
        ),
        icon: <Database size={18} />,
        badge: systemHealth?.databaseStatus === "OK" ? "LIVE" : "CHECK",
        good: systemHealth?.databaseStatus === "OK",
      },
      {
        title: "Mail",
        value: systemHealth?.mailStatus ?? "-",
        icon: <Mail size={18} />,
        badge: systemHealth?.mailStatus === "OK" ? "LIVE" : "CHECK",
        good: systemHealth?.mailStatus === "OK",
      },
      {
        title: "AI Service",
        value: systemHealth?.aiServiceStatus ?? "-",
        icon: <Activity size={18} />,
        badge: systemHealth?.aiServiceStatus === "OK" ? "LIVE" : "CHECK",
        good: systemHealth?.aiServiceStatus === "OK",
      },
      {
        title: "Uptime",
        value: systemHealth?.uptime ?? "-",
        icon: <Clock3 size={18} />,
        badge: "INFO",
        good: true,
      },
      {
        title: "Overall",
        value: systemHealth?.overallStatus ?? "-",
        icon: <HeartPulse size={18} />,
        badge: systemHealth?.overallStatus === "UP" ? "OK" : "CHECK",
        good: systemHealth?.overallStatus === "UP",
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
          good
        />

        <SummaryCard
          title="Disabled Users"
          value={stats?.disabledUsers ?? 0}
          icon={<UserX size={20} />}
          badge="Review"
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
                good={item.good}
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
                      <Chip
                        size="small"
                        label={user.role || "-"}
                        sx={{
                          bgcolor: "rgba(124,92,255,0.14)",
                          color: "#e5e7eb",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>

                    <TableCell sx={tableCellMid}>
                      <Chip
                        label={user.enabled ? "Enabled" : "Disabled"}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          color: user.enabled ? "#86efac" : "#fca5a5",
                          backgroundColor: user.enabled
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(239,68,68,0.12)",
                          border: user.enabled
                            ? "1px solid rgba(16,185,129,0.22)"
                            : "1px solid rgba(239,68,68,0.22)",
                        }}
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

function SummaryCard({ title, value, icon, badge, good }) {
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
        <Chip
          size="small"
          label={badge}
          sx={{
            mt: 1.5,
            fontWeight: 800,
            color: good ? "#86efac" : "#fde68a",
            backgroundColor: good
              ? "rgba(16,185,129,0.12)"
              : "rgba(245,158,11,0.12)",
            border: good
              ? "1px solid rgba(16,185,129,0.22)"
              : "1px solid rgba(245,158,11,0.22)",
          }}
        />
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

function SmallInfoCard({ title, value, icon, badge, good }) {
  return (
    <Box
      sx={{
        p: 1.6,
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.03)",
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
        <Chip
          size="small"
          label={badge}
          sx={{
            mt: 1.2,
            fontWeight: 800,
            color: good ? "#86efac" : "#fde68a",
            backgroundColor: good
              ? "rgba(16,185,129,0.12)"
              : "rgba(245,158,11,0.12)",
            border: good
              ? "1px solid rgba(16,185,129,0.22)"
              : "1px solid rgba(245,158,11,0.22)",
          }}
        />
      ) : null}
    </Box>
  );
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
  background: "rgba(255,255,255,0.03)",
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
