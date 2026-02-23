import React from "react";
import {
  Box,
  Grid,
  Typography,
  Divider,
  Chip,
  Stack
} from "@mui/material";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import EngineeringIcon from "@mui/icons-material/Engineering";
import WorkIcon from "@mui/icons-material/Work";
import PersonIcon from "@mui/icons-material/Person";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import SecurityIcon from "@mui/icons-material/Security";

import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";

/**
 * UI demo data (replace with API later)
 * Suggested endpoints later:
 * - GET /api/admin/dashboard/summary
 * - GET /api/admin/health
 * - GET /api/admin/audit?limit=10
 * - GET /api/admin/access/summary
 */
const demoCounts = {
  admins: 2,
  managers: 4,
  developers: 11,
  clients: 23,
  newToday: 1,
  newThisWeek: 6
};

const demoHealth = {
  api: "OK",
  db: "OK",
  uptime: "99.98%",
  errorRate: "0.2%"
};

const demoAccessSummary = {
  clientModulesEnabled: { enabled: 2, total: 5 },
  userOverrides: 3,
  lastChange: "Today"
};

const demoAudit = [
  { ts: "Today", action: "Created user", actor: "admin@nexora.com", target: "dev@nexora.com" },
  { ts: "Today", action: "Updated role", actor: "admin@nexora.com", target: "manager@nexora.com → MANAGER" },
  { ts: "Yesterday", action: "Disabled user", actor: "admin@nexora.com", target: "client@nexora.com" }
];

function StatusChip({ value }) {
  const good = value === "OK";
  return (
    <Chip
      size="small"
      label={value}
      variant="outlined"
      sx={{
        borderColor: good ? "rgba(34,197,94,0.35)" : "rgba(245,158,11,0.40)",
        backgroundColor: good ? "rgba(34,197,94,0.10)" : "rgba(245,158,11,0.10)"
      }}
    />
  );
}

export default function AdminDashboard() {
  return (
    <Box>
      <PageHeader
        title="Admin Dashboard"
        subtitle="User administration, access control overview, and system health."
      />

      <Grid container spacing={2.5}>
        {/* User breakdown */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Admins"
            value={demoCounts.admins}
            hint="System owners"
            icon={<AdminPanelSettingsIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Managers"
            value={demoCounts.managers}
            hint="Operations"
            icon={<WorkIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Developers"
            value={demoCounts.developers}
            hint="Engineering"
            icon={<EngineeringIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Clients"
            value={demoCounts.clients}
            hint="External users"
            icon={<PersonIcon />}
          />
        </Grid>

        {/* New users */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 900, mb: 0.5 }}>New Users</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
              Registrations summary (admin visibility)
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Today
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 26 }}>
                    {demoCounts.newToday}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    This Week
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 26 }}>
                    {demoCounts.newThisWeek}
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, opacity: 0.7, fontSize: 12 }}>
              (Later: invitations, approvals, onboarding state)
            </Box>
          </Card>
        </Grid>

        {/* System health */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <HealthAndSafetyIcon />
              <Typography sx={{ fontWeight: 900 }}>System Health</Typography>
            </Stack>

            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
              Service status and reliability indicators
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Row label="API" right={<StatusChip value={demoHealth.api} />} />
              </Grid>
              <Grid item xs={6}>
                <Row label="Database" right={<StatusChip value={demoHealth.db} />} />
              </Grid>
              <Grid item xs={6}>
                <Row label="Uptime" right={<Chip size="small" label={demoHealth.uptime} />} />
              </Grid>
              <Grid item xs={6}>
                <Row label="Error Rate" right={<Chip size="small" label={demoHealth.errorRate} />} />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, opacity: 0.7, fontSize: 12 }}>
              (Later: /actuator/health + metrics)
            </Box>
          </Card>
        </Grid>

        {/* Access overview (summary only) */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <SecurityIcon />
              <Typography sx={{ fontWeight: 900 }}>Access Overview</Typography>
            </Stack>

            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
              Summary only — manage rules in the Access Control page.
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Row
                  label="Client modules enabled"
                  right={
                    <Chip
                      size="small"
                      label={`${demoAccessSummary.clientModulesEnabled.enabled} / ${demoAccessSummary.clientModulesEnabled.total}`}
                    />
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Row label="User overrides" right={<Chip size="small" label={`${demoAccessSummary.userOverrides}`} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Row label="Last change" right={<Chip size="small" label={demoAccessSummary.lastChange} />} />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, opacity: 0.7, fontSize: 12 }}>
              (Later: show “last changed by” and module highlights)
            </Box>
          </Card>
        </Grid>

        {/* Admin activity / audit */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <ManageAccountsIcon />
              <Typography sx={{ fontWeight: 900 }}>Admin Activity</Typography>
            </Stack>

            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
              Recent security and access changes
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: "grid", gap: 1.2 }}>
              {demoAudit.map((a, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)"
                  }}
                >
                  <Typography sx={{ fontWeight: 900 }}>{a.action}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    {a.actor} → {a.target}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                    {a.ts}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 2, opacity: 0.7, fontSize: 12 }}>
              (Later: audit filters, export, full history)
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Row({ label, right }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <Typography sx={{ fontWeight: 900 }}>{label}</Typography>
      {right}
    </Box>
  );
}
