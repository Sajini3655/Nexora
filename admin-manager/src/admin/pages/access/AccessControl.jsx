import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Typography,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  Stack
} from "@mui/material";

import SecurityIcon from "@mui/icons-material/Security";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import {
  getAccessModules,
  getAccessRoleMatrix,
  getAccessRoles,
  saveAccessRoleMatrix,
} from "../../../services/api";

/**
 * Access Control - Role-based permissions
 * Backend endpoints:
 * - GET /api/admin/access/modules
 * - GET /api/admin/access/roles
 * - GET /api/admin/access/role-matrix
 * - PUT /api/admin/access/role-matrix
 */

const MODULES = [
  { key: "DASHBOARD", label: "Dashboard", desc: "Basic overview access" },
  { key: "TASKS", label: "Tasks", desc: "Task workflows and boards" },
  { key: "CHAT", label: "Chat", desc: "Messaging and announcements" },
  { key: "FILES", label: "Files", desc: "Uploads and downloads" },
  { key: "REPORTS", label: "Reports", desc: "Exports and analytics" }
];

const ROLES = ["MANAGER", "DEVELOPER", "CLIENT"];


export default function AccessControl() {
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [roleAccess, setRoleAccess] = useState({});

  useEffect(() => {
    loadAccessData();
  }, []);

  const loadAccessData = async () => {
    setLoading(true);
    setError("");

    try {
      const [modulesData, rolesData, matrixData] = await Promise.all([
        getAccessModules(),
        getAccessRoles(),
        getAccessRoleMatrix(),
      ]);

      setModules(modulesData ?? []);
      setRoles(rolesData ?? []);
      setRoleAccess(matrixData ?? {});
    } catch (err) {
      setError("Failed to load access control data. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role, moduleKey) => {
    setRoleAccess((prev) => ({
      ...prev,
      [role]: { ...prev[role], [moduleKey]: !prev[role][moduleKey] }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await saveAccessRoleMatrix(roleAccess);
      setSuccess("Access control changes saved successfully.");
    } catch (err) {
      setError("Failed to save access control changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Typography sx={{ opacity: 0.8 }}>Loading access control...</Typography>;
  }

  return (
    <Box>
      <PageHeader
        title="Access Control"
        subtitle="Define module access permissions by role."
        right={
          <Button variant="outlined" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      ) : null}

      <Card sx={{ p: 2.5 }}>
        <RoleMatrix
          modules={modules}
          roles={roles}
          roleAccess={roleAccess}
          onToggleRole={toggleRole}
        />
      </Card>
    </Box>
  );
}

function RoleMatrix({ modules, roles, roleAccess, onToggleRole }) {
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <SecurityIcon />
        <Typography sx={{ fontWeight: 900 }}>Role Matrix</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          size="small"
          label="Role-based permissions"
          sx={{
            background: "rgba(124,92,255,0.16)",
            border: "1px solid rgba(124,92,255,0.25)"
          }}
        />
      </Stack>

      <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
        Toggle module access for each role. Changes apply globally to all users with that role.
      </Typography>

      <Grid container spacing={2.5}>
        {modules.map((m) => (
          <Grid item xs={12} key={m.key}>
            <Card sx={{ p: 2.25 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 900 }}>{m.label}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {m.desc}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {roles.map((r) => (
                    <FormControlLabel
                      key={r}
                      control={
                        <Switch
                          checked={Boolean(roleAccess?.[r]?.[m.key])}
                          onChange={() => onToggleRole(r, m.key)}
                        />
                      }
                      label={`${r}: ${roleAccess[r][m.key] ? "On" : "Off"}`}
                      sx={{ m: 0 }}
                    />
                  ))}
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function UserOverrides({
  users,
  modules,
  roleAccess,
  overrides,
  selectedUserId,
  setSelectedUserId,
  setOverride,
  summary
}) {
  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  const effectiveAccess = (user, moduleKey) => {
    const o = overrides[moduleKey];
    if (o === true || o === false) return o;
    return Boolean(roleAccess[user.role]?.[moduleKey]);
  };

  if (!selectedUser) {
    return <Typography sx={{ opacity: 0.8 }}>No users available for overrides.</Typography>;
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <SecurityIcon />
        <Typography sx={{ fontWeight: 900 }}>User Overrides</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Pill label="Exceptions only" />
      </Stack>

      <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
        Choose a user and override access per module. “Inherit” uses role matrix.
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <Input
          select
          label="Select User"
          value={selectedUserId ?? ""}
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          sx={{ width: 360 }}
        >
          {users.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.name} ({u.role})
            </MenuItem>
          ))}
        </Input>

        <Card sx={{ p: 2, flex: 1, minWidth: 260 }}>
          <Typography sx={{ fontWeight: 900 }}>
            {selectedUser?.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {selectedUser?.email} • role: {selectedUser?.role}
          </Typography>

          <Divider sx={{ my: 1.25 }} />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip size="small" label={`Allowed: ${summary.allowed}`} />
            <Chip size="small" variant="outlined" label={`Denied: ${summary.denied}`} />
          </Box>
        </Card>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2.5}>
        {modules.map((m) => {
          const overrideVal = overrides[m.key]; // null/true/false
          const eff = selectedUser ? effectiveAccess(selectedUser, m.key) : false;

          return (
            <Grid key={m.key} item xs={12} md={6}>
              <Card sx={{ p: 2.25 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 900 }}>{m.label}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Effective: {eff ? "Allowed" : "Denied"}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={overrideVal === null ? "Inherited" : overrideVal ? "Forced Allow" : "Forced Deny"}
                    variant="outlined"
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant={overrideVal === null ? "contained" : "outlined"}
                    onClick={() => setOverride(selectedUserId, m.key, null)}
                    sx={{ flex: 1 }}
                  >
                    Inherit
                  </Button>
                  <Button
                    variant={overrideVal === true ? "contained" : "outlined"}
                    onClick={() => setOverride(selectedUserId, m.key, true)}
                    sx={{ flex: 1 }}
                  >
                    Allow
                  </Button>
                  <Button
                    variant={overrideVal === false ? "contained" : "outlined"}
                    onClick={() => setOverride(selectedUserId, m.key, false)}
                    sx={{ flex: 1 }}
                  >
                    Deny
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

