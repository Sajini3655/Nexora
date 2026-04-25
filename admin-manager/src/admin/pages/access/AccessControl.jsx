import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import {
  getAccessModules,
  getAccessRoles,
  getAccessRoleMatrix,
  saveAccessRoleMatrix,
} from "../../../services/api";

function Pill({ label }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        fontWeight: 800,
        color: "#a7f3d0",
        backgroundColor: "rgba(16,185,129,0.12)",
        border: "1px solid rgba(16,185,129,0.28)",
      }}
    />
  );
}

function buildMatrix(roles, modules, backendMatrix) {
  const matrix = {};

  roles.forEach((role) => {
    matrix[role] = {};

    modules.forEach((module) => {
      matrix[role][module.key] = Boolean(backendMatrix?.[role]?.[module.key]);
    });
  });

  return matrix;
}

export default function AccessControl() {
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [roleAccess, setRoleAccess] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalEnabled = useMemo(() => {
    let count = 0;

    roles.forEach((role) => {
      modules.forEach((module) => {
        if (roleAccess?.[role]?.[module.key]) {
          count += 1;
        }
      });
    });

    return count;
  }, [roles, modules, roleAccess]);

  const totalPermissions = roles.length * modules.length;

  const loadAccessControl = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const [modulesData, rolesData, matrixData] = await Promise.all([
        getAccessModules(),
        getAccessRoles(),
        getAccessRoleMatrix(),
      ]);

      const safeModules = Array.isArray(modulesData) ? modulesData : [];
      const safeRoles = Array.isArray(rolesData) ? rolesData : [];

      setModules(safeModules);
      setRoles(safeRoles);
      setRoleAccess(buildMatrix(safeRoles, safeModules, matrixData ?? {}));
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load access control data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccessControl();
  }, []);

  const toggleRole = (role, moduleKey) => {
    setRoleAccess((prev) => ({
      ...prev,
      [role]: {
        ...(prev?.[role] || {}),
        [moduleKey]: !Boolean(prev?.[role]?.[moduleKey]),
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const saved = await saveAccessRoleMatrix(roleAccess);
      setRoleAccess(buildMatrix(roles, modules, saved ?? roleAccess));

      setSuccess("Role access matrix saved successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to save role access matrix."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">
            Loading access control...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Access Control"
        subtitle="Manage module access by role. User overrides are removed from this page."
        right={<Pill label="Role Matrix Only" />}
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

      <Card sx={{ p: { xs: 2, md: 2.8 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
              <SecurityIcon />
              <Typography variant="h5" sx={{ fontWeight: 950 }}>
                Role Matrix
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ opacity: 0.72 }}>
              These permissions apply to every user who has that role. Multi-role users get access if any of their roles allow the module.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Pill label={`${totalEnabled}/${totalPermissions} enabled`} />

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{ borderRadius: 999, fontWeight: 900, px: 2.5 }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2.5, borderColor: "rgba(255,255,255,0.08)" }} />

        {modules.length === 0 || roles.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <Typography>No access modules or roles found.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {modules.map((module) => (
              <Grid item xs={12} key={module.key}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.25,
                    borderRadius: 3.5,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background:
                      "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "stretch", md: "center" },
                      justifyContent: "space-between",
                      gap: 2,
                      flexDirection: { xs: "column", md: "row" },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 950, color: "#fff" }}>
                        {module.label}
                      </Typography>

                      <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.35 }}>
                        {module.desc || module.key}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.25,
                        flexWrap: "wrap",
                        justifyContent: { xs: "flex-start", md: "flex-end" },
                      }}
                    >
                      {roles.map((role) => {
                        const enabled = Boolean(roleAccess?.[role]?.[module.key]);

                        return (
                          <Box
                            key={`${role}-${module.key}`}
                            sx={{
                              px: 1.5,
                              py: 1,
                              borderRadius: 999,
                              border: enabled
                                ? "1px solid rgba(124,92,255,0.55)"
                                : "1px solid rgba(255,255,255,0.12)",
                              background: enabled
                                ? "rgba(124,92,255,0.18)"
                                : "rgba(255,255,255,0.04)",
                            }}
                          >
                            <FormControlLabel
                              sx={{ m: 0 }}
                              control={
                                <Switch
                                  checked={enabled}
                                  onChange={() => toggleRole(role, module.key)}
                                />
                              }
                              label={
                                <Typography sx={{ fontWeight: 850, fontSize: 14 }}>
                                  {role}
                                </Typography>
                              }
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Card>
    </Box>
  );
}
