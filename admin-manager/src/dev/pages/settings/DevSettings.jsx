import React from "react";
import { Box, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";

export default function DevSettings() {
  return (
    <DevLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.5 }}>
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", mt: 0.75 }}>
          Personal preferences and workspace behavior.
        </Typography>
      </Box>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
          Settings placeholder
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>
          We can build this section later with theme, notification, and workspace controls.
        </Typography>
      </Card>
    </DevLayout>
  );
}
