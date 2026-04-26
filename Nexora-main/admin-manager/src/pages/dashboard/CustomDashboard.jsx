import React from "react";
import { Box, Typography, Grid, Chip } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CustomDashboard() {
  const { user } = useAuth();
  const role = user?.role || "Custom Role";
  const permissions = user?.allowedModules || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {role} Dashboard
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Welcome to your custom role dashboard. This screen is created for any role that is not a built-in ADMIN, MANAGER, or DEVELOPER role.
      </Typography>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Role Permissions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {['DASHBOARD', 'TASKS', 'CHAT', 'FILES', 'REPORTS'].map((module) => (
          <Grid item xs={12} sm={6} md={4} key={module}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {module}
              </Typography>
              <Chip
                label={permissions.includes(module) ? 'Allowed' : 'Denied'}
                color={permissions.includes(module) ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" color="text.secondary">
        If you need a different layout or specialized pages for this role, you can add custom routes and a custom shell for this role name.
      </Typography>
    </Box>
  );
}
