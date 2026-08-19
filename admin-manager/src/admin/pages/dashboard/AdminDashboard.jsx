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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";
import { closeWithBlur } from "../../../utils/focus";
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
  X,
  RotateCcw,
} from "lucide-react";
import { getAdminDashboard, getSystemHealth } from "../../../services/api";
import DashboardHero from "../../../components/ui/DashboardHero.jsx";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import useLiveRefresh from "../../../hooks/useLiveRefresh";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHealthItem, setSelectedHealthItem] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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
        description: "Backend API server for handling requests and data operations",
        details: [
          { label: "Service URL", value: systemHealth?.backendUrl ?? "-" },
          { label: "Status", value: systemHealth?.apiStatus ?? "-" },
          { label: "Response", value: systemHealth?.apiMessage ?? "No information" },
        ],
        issue: systemHealth?.apiStatus === "OK" ? null : (systemHealth?.apiMessage ?? "API is not responding"),
        action: systemHealth?.apiStatus === "OK" ? "System is running normally" : "Restart backend service and check server logs",
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
        description: "Primary data storage and query service",
        details: [
          { label: "Type", value: systemHealth?.databaseType ?? "Unknown" },
          { label: "Status", value: systemHealth?.databaseStatus ?? "-" },
          { label: "Latency", value: `${systemHealth?.databaseLatencyMs ?? 0}ms` },
          { label: "Response", value: systemHealth?.databaseMessage ?? "No information" },
        ],
        issue: systemHealth?.databaseStatus === "OK" ? null : (systemHealth?.databaseMessage ?? "Database connection failed"),
        action: systemHealth?.databaseStatus === "OK" ? "Database is responding normally" : "Check database connectivity and credentials",
      },
      {
        title: "Mail",
        value: systemHealth?.mailStatus ?? "-",
        icon: <Mail size={18} />,
        badge: systemHealth?.mailStatus === "OK" ? "LIVE" : systemHealth?.mailStatus === "NOT_CONFIGURED" ? "CONFIG" : "CHECK",
        badgeTone: systemHealth?.mailStatus === "OK" ? "success" : "warning",
        description: "Email service for sending notifications and alerts",
        details: [
          { label: "Provider", value: systemHealth?.mailProvider ?? "Unknown" },
          { label: "Status", value: systemHealth?.mailStatus ?? "-" },
          { label: "Response", value: systemHealth?.mailMessage ?? "No information" },
        ],
        issue: systemHealth?.mailStatus === "OK" ? null : (systemHealth?.mailMessage ?? "Mail service unavailable"),
        action: systemHealth?.mailStatus === "OK" ? "Email service is operational" : "Configure MAIL_USERNAME and MAIL_PASSWORD, then restart the backend",
      },
      {
        title: "AI Service",
        value: systemHealth?.aiServiceStatus ?? "-",
        icon: <Activity size={18} />,
        badge: systemHealth?.aiServiceStatus === "OK" ? "LIVE" : "CHECK",
        badgeTone: systemHealth?.aiServiceStatus === "OK" ? "success" : "warning",
        description: "Handles chat summaries and AI task suggestions",
        details: [
          { label: "Service URL", value: systemHealth?.aiServiceUrl ?? "-" },
          { label: "Model", value: systemHealth?.aiModel ?? "Unknown" },
          { label: "Status", value: systemHealth?.aiServiceStatus ?? "-" },
          { label: "Response", value: systemHealth?.aiServiceMessage ?? "No information" },
        ],
        issue: systemHealth?.aiServiceStatus === "OK" ? null : (systemHealth?.aiServiceMessage ?? "AI service not responding"),
        action: systemHealth?.aiServiceStatus === "OK" ? "AI service is operational" : "Start AI service: cd ai-service && uvicorn main:app --reload",
      },
      {
        title: "Uptime",
        value: systemHealth?.uptime ?? "-",
        icon: <Clock3 size={18} />,
        badge: "INFO",
        badgeTone: "info",
        description: "System availability and continuous operation time",
        details: [
          { label: "Total Uptime", value: systemHealth?.uptime ?? "-" },
          { label: "Last Check", value: systemHealth?.lastCheckedAt ? new Date(systemHealth.lastCheckedAt).toLocaleString() : "-" },
          { label: "Check Interval", value: `${systemHealth?.refreshIntervalSeconds ?? 60}s` },
        ],
        issue: null,
        action: "Uptime metric is informational only",
      },
      {
        title: "Overall",
        value: systemHealth?.overallStatus ?? "-",
        icon: <HeartPulse size={18} />,
        badge: systemHealth?.overallStatus === "UP" ? "OK" : "CHECK",
        badgeTone: systemHealth?.overallStatus === "UP" ? "success" : "warning",
        description: "Aggregate health status of all system components",
        details: [
          { label: "API Status", value: systemHealth?.apiStatus ?? "-" },
          { label: "Database Status", value: systemHealth?.databaseStatus ?? "-" },
          { label: "Mail Status", value: systemHealth?.mailStatus ?? "-" },
          { label: "AI Service Status", value: systemHealth?.aiServiceStatus ?? "-" },
          { label: "Overall Status", value: systemHealth?.overallStatus ?? "-" },
        ],
        issue: systemHealth?.overallStatus === "UP" ? null : "One or more critical services are down",
        action: systemHealth?.overallStatus === "UP" ? "All systems operational" : "Review individual service status and take corrective action",
      },
    ];
  }, [systemHealth]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: "var(--nx-purple)" }} />
          <Typography sx={{ color: "var(--nx-muted)" }}>
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
          backgroundColor: "var(--nx-card)",
          border: "1px solid var(--nx-red)",
          color: "var(--nx-text)",
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <DashboardHero
        icon={<AdminPanelSettingsRoundedIcon />}
        title="Admin Dashboard"
      />

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
        <SectionCard title="User Roles">
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

        <SectionCard title="System Health">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 1.5,
            }}
          >
            {healthCards.map((item) => (
              <Box
                key={item.title}
                onClick={(event) => {
                  event.currentTarget.blur();
                  setSelectedHealthItem(item);
                  setDetailDialogOpen(true);
                }}
                sx={{ cursor: "pointer" }}
              >
                <SmallInfoCard
                  title={item.title}
                  value={item.value}
                  icon={item.icon}
                  badge={item.badge}
                  badgeTone={item.badgeTone}
                  sx={{
                    transition: "border-color 0.2s ease-in-out, background-color 0.2s ease-in-out",
                  }}
                />
              </Box>
            ))}
          </Box>
        </SectionCard>
      </Box>

      <SectionCard title="Recent Users">
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
                  <TableCell colSpan={5} sx={{ color: "var(--nx-muted)" }}>
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

      <HealthDetailDialog
        item={selectedHealthItem}
        open={detailDialogOpen}
        onClose={() => closeWithBlur(() => setDetailDialogOpen(false))}
        onRefresh={loadDashboard}
      />
    </Stack>
  );
}

function SummaryCard({ title, value, icon, badge, badgeTone = "neutral" }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: "22px",
        bgcolor: "var(--nx-card)",
        border: "1px solid var(--nx-border)",
        boxShadow: "var(--nx-shadow)",
        color: "var(--nx-text)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--nx-muted)", fontWeight: 700 }}
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
            bgcolor: "var(--nx-panel-2)",
            color: "var(--nx-purple)",
            border: "1px solid var(--nx-border)",
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
        p: { xs: 1.5, sm: 2.2 },
        borderRadius: 3,
        bgcolor: "var(--nx-card)",
        border: "1px solid var(--nx-border)",
        boxShadow: "var(--nx-shadow)",
        color: "var(--nx-text)",
      }}
    >
      <Box sx={{ mb: { xs: 1.25, sm: 1.8 } }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          {title}
        </Typography>

        <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 0.4 }}>
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
        bgcolor: "var(--nx-panel-2)",
        border: "1px solid var(--nx-border)",
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
            bgcolor: "var(--nx-card)",
            color: "var(--nx-purple)",
            border: "1px solid var(--nx-border)",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: "var(--nx-muted)", fontWeight: 700 }}
          >
            {title}
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 900 }}>
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
        backgroundColor: "color-mix(in srgb, var(--nx-green) 16%, transparent)",
        color: "var(--nx-green)",
        border: "1px solid color-mix(in srgb, var(--nx-green) 38%, transparent)",
      };

    case "warning":
      return {
        backgroundColor: "color-mix(in srgb, var(--nx-yellow) 18%, transparent)",
        color: "var(--nx-yellow)",
        border: "1px solid color-mix(in srgb, var(--nx-yellow) 40%, transparent)",
      };

    case "danger":
      return {
        backgroundColor: "color-mix(in srgb, var(--nx-red) 18%, transparent)",
        color: "var(--nx-red)",
        border: "1px solid color-mix(in srgb, var(--nx-red) 40%, transparent)",
      };

    case "purple":
      return {
        backgroundColor: "color-mix(in srgb, var(--nx-purple) 18%, transparent)",
        color: "var(--nx-purple)",
        border: "1px solid color-mix(in srgb, var(--nx-purple) 40%, transparent)",
      };

    case "blue":
      return {
        backgroundColor: "color-mix(in srgb, var(--nx-blue) 18%, transparent)",
        color: "var(--nx-blue)",
        border: "1px solid color-mix(in srgb, var(--nx-blue) 40%, transparent)",
      };

    case "info":
      return {
        backgroundColor: "color-mix(in srgb, var(--nx-blue) 14%, transparent)",
        color: "var(--nx-blue)",
        border: "1px solid color-mix(in srgb, var(--nx-blue) 34%, transparent)",
      };

    default:
      return {
        backgroundColor: "color-mix(in srgb, var(--nx-muted) 18%, transparent)",
        color: "var(--nx-text)",
        border: "1px solid var(--nx-border)",
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
  color: "var(--nx-muted)",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  borderBottom: "1px solid var(--nx-border)",
};

const tableCellBase = {
  background: "var(--nx-panel-2)",
  borderBottom: "none",
  color: "var(--nx-text)",
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
  color: "var(--nx-muted)",
};

function HealthDetailDialog({ item, open, onClose, onRefresh }) {
  if (!item) return null;

  const getStatusColor = (status) => {
    if (status === "OK" || status === "LIVE" || status === "UP") return "#10b981";
    if (status === "DOWN" || status === "ERROR") return "#ef4444";
    return "#f59e0b";
    if (status === "OK" || status === "LIVE" || status === "UP") return "var(--nx-green)";
    if (status === "DOWN" || status === "ERROR") return "var(--nx-red)";
    return "var(--nx-yellow)";
  };

  const handleRefresh = async () => {
    await onRefresh();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: "var(--nx-card)",
          border: "1px solid var(--nx-border)",
          boxShadow: "var(--nx-shadow)",
          width: { xs: "90%", sm: "420px" },
          maxHeight: "75vh",
          mt: 8,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pb: 1.5,
          borderBottom: "1px solid var(--nx-border)",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "var(--nx-panel-2)",
            color: "var(--nx-purple)",
            flexShrink: 0,
          }}
        >
          {item.icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {item.title}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 1.2,
            py: 0.4,
            borderRadius: 999,
            bgcolor: `color-mix(in srgb, ${getStatusColor(item.value)} 18%, transparent)`,
            border: `1px solid color-mix(in srgb, ${getStatusColor(item.value)} 42%, transparent)`,
            color: getStatusColor(item.value),
            fontSize: 12,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {item.badge}
        </Box>
        <Button
          size="small"
          onClick={onClose}
          sx={{
            minWidth: "auto",
            p: 0.5,
            color: "var(--nx-muted)",
            "&:hover": { color: "var(--nx-text)" },
          }}
        >
          <X size={18} />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2.5}>
          {}
          <Box>
            <Typography
              sx={{ variant: "caption", fontWeight: 700, color: "var(--nx-muted)", mb: 0.8 }}
            >
              SERVICE OVERVIEW
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--nx-text)" }}>
              {item.description}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "var(--nx-border)" }} />

          {}
          <Box>
            <Typography
              sx={{ variant: "caption", fontWeight: 700, color: "var(--nx-muted)", mb: 1 }}
            >
              SERVICE DETAILS
            </Typography>
            <Stack spacing={1.2}>
              {item.details && item.details.map((detail, idx) => (
                <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                    {detail.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "var(--nx-text)",
                      fontWeight: 600,
                      textAlign: "right",
                      maxWidth: "60%",
                      wordBreak: "break-word",
                    }}
                  >
                    {detail.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {}
          {item.issue && (
            <>
              <Divider sx={{ borderColor: "var(--nx-border)" }} />
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: `color-mix(in srgb, ${getStatusColor(item.value)} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${getStatusColor(item.value)} 28%, transparent)`,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: getStatusColor(item.value), mb: 0.6 }}>
                  ⚠ ISSUE
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--nx-text)" }}>
                  {item.issue}
                </Typography>
              </Box>
            </>
          )}

          {}
          {item.action && (
            <>
              <Divider sx={{ borderColor: "var(--nx-border)" }} />
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "color-mix(in srgb, var(--nx-blue) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--nx-blue) 26%, transparent)",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--nx-blue)", mb: 0.6 }}>
                  💡 RECOMMENDED ACTION
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--nx-text)" }}>
                  {item.action}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          pt: 1.5,
          px: 3,
          pb: 2.5,
          borderTop: "1px solid var(--nx-border)",
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "var(--nx-muted)",
            "&:hover": { bgcolor: "var(--nx-panel-2)" },
          }}
        >
          Close
        </Button>
        <Button
          onClick={handleRefresh}
          startIcon={<RotateCcw size={16} />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            bgcolor: "color-mix(in srgb, var(--nx-purple) 16%, transparent)",
            color: "var(--nx-purple)",
            border: "1px solid color-mix(in srgb, var(--nx-purple) 32%, transparent)",
            "&:hover": {
              bgcolor: "color-mix(in srgb, var(--nx-purple) 22%, transparent)",
              borderColor: "color-mix(in srgb, var(--nx-purple) 48%, transparent)",
            },
          }}
        >
          Refresh
        </Button>
      </DialogActions>
    </Dialog>
  );
}

