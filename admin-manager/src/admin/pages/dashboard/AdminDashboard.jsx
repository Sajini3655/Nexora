import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
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
  Database,
  HeartPulse,
  Mail,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
  Users,
  Code2,
  BarChart3,
  History,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  getAdminActivity,
  getAdminDashboard,
  getRegistrationsLast7Days,
  getSystemHealth,
} from "../../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetching = useRef(false);

  const loadDashboard = async () => {
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

      try {
        const chart = await getRegistrationsLast7Days();
        setRegistrations(chart ?? []);
      } catch (chartErr) {
        console.error("Failed to load registrations chart", chartErr);
        setRegistrations([]);
      }

      try {
        const act = await getAdminActivity();
        setActivity(act ?? []);
      } catch (activityErr) {
        console.error("Failed to load admin activity", activityErr);
        setActivity([]);
      }

      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const roleTotal = useMemo(() => {
    if (!stats) return 0;
    return (
      (stats.admins ?? 0) +
      (stats.managers ?? 0) +
      (stats.developers ?? 0) +
      (stats.clients ?? 0)
    );
  }, [stats]);

  const roleDistribution = useMemo(() => {
    if (!stats || roleTotal === 0) return [];
    return [
      {
        label: "Admins",
        value: stats.admins ?? 0,
        icon: <ShieldCheck size={16} />,
      },
      {
        label: "Managers",
        value: stats.managers ?? 0,
        icon: <BriefcaseBusiness size={16} />,
      },
      {
        label: "Developers",
        value: stats.developers ?? 0,
        icon: <Code2 size={16} />,
      },
      {
        label: "Clients",
        value: stats.clients ?? 0,
        icon: <UserRound size={16} />,
      },
    ].map((item) => ({
      ...item,
      percent: Math.round((item.value / roleTotal) * 100),
    }));
  }, [stats, roleTotal]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress color="primary" />
          <Typography color="text.secondary">Loading dashboard...</Typography>
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
      <HeroPanel stats={stats} systemHealth={systemHealth} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.6fr 1fr" },
          gap: 3,
        }}
      >
        <SectionCard
          title="User Roles"
          subtitle="Live role counts from the backend"
          actionLabel={getFreshnessLabel(
            systemHealth?.lastCheckedAt,
            systemHealth?.refreshIntervalSeconds
          )}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <MetricCard
              title="Admins"
              value={stats?.admins ?? 0}
              subtitle="System owners"
              icon={<ShieldCheck size={22} />}
            />
            <MetricCard
              title="Managers"
              value={stats?.managers ?? 0}
              subtitle="Operations"
              icon={<BriefcaseBusiness size={22} />}
            />
            <MetricCard
              title="Developers"
              value={stats?.developers ?? 0}
              subtitle="Engineering"
              icon={<Code2 size={22} />}
            />
            <MetricCard
              title="Clients"
              value={stats?.clients ?? 0}
              subtitle="External users"
              icon={<UserRound size={22} />}
            />
          </Box>
        </SectionCard>

        <SectionCard
          title="Role Distribution"
          subtitle="Share of total users by role"
          actionLabel={`${roleTotal} users`}
        >
          <Stack spacing={2}>
            {roleDistribution.map((item) => (
              <DistributionRow key={item.label} item={item} />
            ))}
          </Stack>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" },
          gap: 3,
        }}
      >
        <SectionCard
          title="Growth Snapshot"
          subtitle="Registrations for the last 7 days"
          actionLabel={getFreshnessLabel(
            systemHealth?.lastCheckedAt,
            systemHealth?.refreshIntervalSeconds
          )}
        >
          <Box sx={{ height: 300, width: "100%", minWidth: 0 }}>
            {registrations.length === 0 ? (
              <Box
                sx={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  color: "text.secondary",
                }}
              >
                No registration trend data available.
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrations}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="rgba(231,233,238,0.65)"
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="rgba(231,233,238,0.65)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,18,35,0.96)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="total"
                    radius={[10, 10, 0, 0]}
                    fill="#7c5cff"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </SectionCard>

        <SectionCard
          title="User Overview"
          subtitle="Current account status"
          actionLabel={getFreshnessLabel(
            systemHealth?.lastCheckedAt,
            systemHealth?.refreshIntervalSeconds
          )}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 2,
            }}
          >
            <MetricCard
              compact
              title="Total Users"
              value={stats?.totalUsers ?? 0}
              icon={<Users size={20} />}
            />
            <MetricCard
              compact
              title="Enabled Users"
              value={stats?.enabledUsers ?? 0}
              icon={<UserCheck size={20} />}
              badge="Healthy"
              good
            />
            <MetricCard
              compact
              title="Disabled Users"
              value={stats?.disabledUsers ?? 0}
              icon={<UserX size={20} />}
              badge="Review"
            />
            <MetricCard
              compact
              title="Pending Invites"
              value={stats?.pendingInvites ?? 0}
              icon={<Mail size={20} />}
            />
          </Box>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" },
          gap: 3,
        }}
      >
        <SectionCard
          title="System Health"
          subtitle="Application and database status"
          actionLabel={systemHealth?.overallStatus || "-"}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <MetricCard
              compact
              title="API"
              value={systemHealth?.apiStatus ?? "-"}
              icon={<Activity size={20} />}
              badge={systemHealth?.apiStatus === "OK" ? "LIVE" : "CHECK"}
              good={systemHealth?.apiStatus === "OK"}
            />
            <MetricCard
              compact
              title="Database"
              value={formatDatabaseValue(
                systemHealth?.databaseStatus,
                systemHealth?.databaseLatencyMs
              )}
              icon={<Database size={20} />}
              badge={systemHealth?.databaseStatus === "OK" ? "LIVE" : "CHECK"}
              good={systemHealth?.databaseStatus === "OK"}
            />
            <MetricCard
              compact
              title="Mail"
              value={systemHealth?.mailStatus ?? "-"}
              icon={<Mail size={20} />}
              badge={systemHealth?.mailStatus === "OK" ? "LIVE" : "CHECK"}
              good={systemHealth?.mailStatus === "OK"}
            />
            <MetricCard
              compact
              title="AI Service"
              value={systemHealth?.aiServiceStatus ?? "-"}
              icon={<Activity size={20} />}
              badge={systemHealth?.aiServiceStatus === "OK" ? "LIVE" : "CHECK"}
              good={systemHealth?.aiServiceStatus === "OK"}
            />
            <MetricCard
              compact
              title="Uptime"
              value={systemHealth?.uptime ?? "-"}
              icon={<Clock3 size={20} />}
            />
            <MetricCard
              compact
              title="Overall"
              value={systemHealth?.overallStatus ?? "-"}
              icon={<HeartPulse size={20} />}
              badge={systemHealth?.overallStatus === "UP" ? "OK" : "CHECK"}
              good={systemHealth?.overallStatus === "UP"}
            />
          </Box>
        </SectionCard>

        <SectionCard
          title="Admin Signals"
          subtitle="Quick health summary"
          actionLabel={formatLastChecked(systemHealth?.lastCheckedAt)}
        >
          <Stack spacing={2}>
            <MiniSignal
              label="Enabled ratio"
              value={`${getPercent(stats?.enabledUsers, stats?.totalUsers)}%`}
            />
            <MiniSignal
              label="Disabled ratio"
              value={`${getPercent(stats?.disabledUsers, stats?.totalUsers)}%`}
            />
            <MiniSignal
              label="Pending invites"
              value={`${stats?.pendingInvites ?? 0}`}
            />
            <MiniSignal
              label="Weekly new users"
              value={`${stats?.newUsersThisWeek ?? 0}`}
            />
            <MiniSignal
              label="Mail service"
              value={`${systemHealth?.mailStatus ?? "UNKNOWN"}`}
            />
            <MiniSignal
              label="AI service"
              value={`${systemHealth?.aiServiceStatus ?? "UNKNOWN"}`}
            />
          </Stack>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 3,
        }}
      >
        <SectionCard
          title="Recent Users"
          subtitle="Latest registered users"
          actionLabel={<BarChart3 size={16} />}
        >
          <Box sx={{ overflowX: "auto" }}>
            <Table
              sx={{
                minWidth: 760,
                borderCollapse: "separate",
                borderSpacing: "0 12px",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                      No recent users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell sx={tableCellLeft}>{user.name}</TableCell>
                      <TableCell sx={tableCellMid}>{user.email}</TableCell>
                      <TableCell sx={tableCellMid}>{user.role}</TableCell>
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

        <SectionCard
          title="Admin Activity"
          subtitle="Latest admin actions"
          actionLabel={<History size={16} />}
        >
          <Stack spacing={1.5}>
            {activity.length === 0 ? (
              <Typography color="text.secondary">
                No recent activity found.
              </Typography>
            ) : (
              activity.map((item, index) => (
                <Paper
                  key={`${item.createdAt}-${index}`}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "20px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <Stack spacing={0.5}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Typography sx={{ color: "#fff", fontWeight: 800 }}>
                        {formatAction(item.action)}
                      </Typography>
                      <Chip
                        size="small"
                        label={formatAction(item.action)}
                        sx={activityChipStyle(item.action)}
                      />
                    </Stack>

                    <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                      Actor: {item.actorEmail || "-"}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                      Target: {item.targetEmail || "-"}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                      {item.details || "No details"}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                      {formatDate(item.createdAt)}
                    </Typography>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}

function HeroPanel({ stats, systemHealth }) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "38px",
        p: { xs: 2.5, md: 3.5 },
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(circle at top left, rgba(120,90,255,0.18), transparent 26%), radial-gradient(circle at top right, rgba(0,255,170,0.08), transparent 22%), linear-gradient(180deg, rgba(16,24,56,0.96), rgba(6,10,28,0.98))",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.4fr 0.8fr" },
          gap: 3,
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 34, md: 48 },
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -1.2,
            }}
          >
            Admin Dashboard
          </Typography>
          <Typography
            sx={{
              mt: 1.25,
              maxWidth: 760,
              color: "text.secondary",
              fontSize: { xs: 16, md: 21 },
            }}
          >
            User administration, access control overview, and live system health.
          </Typography>

          <Stack
            direction="row"
            spacing={1.25}
            useFlexGap
            flexWrap="wrap"
            sx={{ mt: 2.5 }}
          >
            <Chip
              label={`Total Users: ${stats?.totalUsers ?? 0}`}
              sx={heroChip}
            />
            <Chip
              label={`Pending Invites: ${stats?.pendingInvites ?? 0}`}
              sx={heroChip}
            />
            <Chip
              label={`System: ${systemHealth?.overallStatus ?? "-"}`}
              sx={heroChip}
            />
          </Stack>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "30px",
            p: 2.5,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography sx={{ fontWeight: 800, color: "#fff", mb: 1.5 }}>
            Platform Snapshot
          </Typography>

          <Stack spacing={1.5}>
            <SnapshotRow
              label="Enabled Accounts"
              value={`${stats?.enabledUsers ?? 0}`}
            />
            <SnapshotRow
              label="Disabled Accounts"
              value={`${stats?.disabledUsers ?? 0}`}
            />
            <SnapshotRow
              label="Today"
              value={`${stats?.newUsersToday ?? 0}`}
            />
            <SnapshotRow
              label="This Week"
              value={`${stats?.newUsersThisWeek ?? 0}`}
            />
          </Stack>
        </Paper>
      </Box>
    </Paper>
  );
}

function SectionCard({ title, subtitle, children, actionLabel }) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "32px",
        p: { xs: 2, md: 3 },
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(circle at top left, rgba(100,80,255,0.12), transparent 24%), radial-gradient(circle at top right, rgba(0,255,170,0.08), transparent 22%), linear-gradient(180deg, rgba(12,18,45,0.96), rgba(5,10,30,0.98))",
        boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
      }}
    >
      <Box
        sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 24, md: 30 },
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -0.5,
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
            {subtitle}
          </Typography>
        </Box>

        {actionLabel ? (
          typeof actionLabel === "string" ? (
            <Chip
              label={actionLabel}
              size="small"
              sx={{
                alignSelf: "flex-start",
                color: "#dbe4ff",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontWeight: 700,
              }}
            />
          ) : (
            <Box sx={{ color: "text.secondary", mt: 0.5 }}>{actionLabel}</Box>
          )
        ) : null}
      </Box>

      <Divider sx={{ mb: 2.5 }} />
      {children}
    </Paper>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  compact = false,
  good,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        px: 3,
        py: compact ? 2.25 : 2.75,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(circle at top left, rgba(91,66,243,0.16), transparent 35%), linear-gradient(180deg, rgba(10,14,40,0.95), rgba(5,10,30,0.98))",
        boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: compact ? 48 : 56,
              height: compact ? 48 : 56,
              color: "#c4b5fd",
              bgcolor: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {icon}
          </Avatar>

          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                color: "#fff",
                fontSize: compact ? 14 : 16,
              }}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                sx={{ mt: 0.75, color: "text.secondary", fontSize: 14 }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Box sx={{ textAlign: "right" }}>
          <Typography
            sx={{
              fontSize: compact ? 34 : 40,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1,
              letterSpacing: -1,
            }}
          >
            {value}
          </Typography>

          {badge ? (
            <Chip
              label={badge}
              size="small"
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
        </Box>
      </Box>
    </Paper>
  );
}

function DistributionRow({ item }) {
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 0.8 }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar
            sx={{
              width: 30,
              height: 30,
              bgcolor: "rgba(139,92,246,0.14)",
              color: "#c4b5fd",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {item.icon}
          </Avatar>
          <Typography sx={{ fontWeight: 700, color: "#fff" }}>
            {item.label}
          </Typography>
        </Stack>

        <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
          {item.value} • {item.percent}%
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={item.percent}
        sx={{
          height: 10,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.06)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(124,92,255,1), rgba(75,175,255,1))",
          },
        }}
      />
    </Box>
  );
}

function MiniSignal({ label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ color: "text.secondary" }}>{label}</Typography>
        <Typography sx={{ color: "#fff", fontWeight: 900 }}>{value}</Typography>
      </Stack>
    </Paper>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{ color: "text.secondary" }}>{label}</Typography>
      <Typography sx={{ color: "#fff", fontWeight: 900 }}>{value}</Typography>
    </Stack>
  );
}

function formatAction(action) {
  if (!action) return "Unknown action";
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function activityChipStyle(action) {
  const value = (action || "").toUpperCase();

  if (value.includes("DELETE")) {
    return {
      fontWeight: 700,
      color: "#fecaca",
      backgroundColor: "rgba(239,68,68,0.15)",
      border: "1px solid rgba(239,68,68,0.22)",
    };
  }

  if (value.includes("DISABLE") || value.includes("FAILED")) {
    return {
      fontWeight: 700,
      color: "#fde68a",
      backgroundColor: "rgba(245,158,11,0.15)",
      border: "1px solid rgba(245,158,11,0.22)",
    };
  }

  if (
    value.includes("ENABLE") ||
    value.includes("CREATE") ||
    value.includes("INVITE") ||
    value.includes("UPDATE") ||
    value.includes("RESENT")
  ) {
    return {
      fontWeight: 700,
      color: "#86efac",
      backgroundColor: "rgba(16,185,129,0.15)",
      border: "1px solid rgba(16,185,129,0.22)",
    };
  }

  return {
    fontWeight: 700,
    color: "#dbeafe",
    backgroundColor: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.22)",
  };
}

function getPercent(part = 0, total = 0) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
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

function getFreshnessLabel(lastCheckedAt, refreshIntervalSeconds = 10) {
  if (!lastCheckedAt) return "Not synced";

  const checkedAt = new Date(lastCheckedAt);
  if (Number.isNaN(checkedAt.getTime())) return "Not synced";

  const ageSeconds = Math.floor((Date.now() - checkedAt.getTime()) / 1000);
  const staleAfter = Math.max(10, Number(refreshIntervalSeconds || 10) * 2);

  if (ageSeconds <= staleAfter) {
    return `Live (${ageSeconds}s ago)`;
  }

  return `Stale (${ageSeconds}s ago)`;
}

function formatLastChecked(lastCheckedAt) {
  if (!lastCheckedAt) return "No timestamp";
  const checkedAt = new Date(lastCheckedAt);
  if (Number.isNaN(checkedAt.getTime())) return "No timestamp";
  return `Checked ${checkedAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

const heroChip = {
  color: "#dbe4ff",
  backgroundColor: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  fontWeight: 700,
};

const tableCellBase = {
  background: "rgba(255,255,255,0.03)",
  borderBottom: "none",
};

const tableCellLeft = {
  ...tableCellBase,
  borderTopLeftRadius: 16,
  borderBottomLeftRadius: 16,
  fontWeight: 700,
};

const tableCellMid = {
  ...tableCellBase,
};

const tableCellRight = {
  ...tableCellBase,
  borderTopRightRadius: 16,
  borderBottomRightRadius: 16,
  color: "text.secondary",
};