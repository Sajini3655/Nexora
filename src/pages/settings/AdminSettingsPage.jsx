import React from "react";
import { Typography } from "@mui/material";
import Card from "../../components/ui/Card.jsx";

export default function AdminSettingsPage() {
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Settings
      </Typography>
      <Card>
        <Typography sx={{ opacity: 0.8 }}>
          Add settings here (roles, permissions, AI config, etc.)
        </Typography>
      </Card>
    </>
  );
}
