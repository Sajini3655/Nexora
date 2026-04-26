import React from "react";
import { Box, Typography, Grid, Divider } from "@mui/material";
import Card from "../../components/ui/Card";
import { AuthProvider, useAuth } from "../../context/AuthContext.jsx";
export default function AdminProfile() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <Typography fontWeight={800} sx={{ mb: 2 }}>
              Account Information
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Info label="Name" value={user.name} />
            <Info label="Email" value={user.email} />
            <Info label="Role" value={user.role} />
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <Typography fontWeight={800} sx={{ mb: 2 }}>
              Security
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Info label="Account Type" value="Administrator" />
            <Info label="Status" value="Active" />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Info({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {label}
      </Typography>
      <Typography fontWeight={700}>{value || "-"}</Typography>
    </Box>
  );
}
