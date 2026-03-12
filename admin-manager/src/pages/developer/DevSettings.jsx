import React from "react";
import { Box, Typography } from "@mui/material";
import Card from "../../components/ui/Card.jsx";

export default function DevSettings() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 950, mb: 2 }}>
        Settings
      </Typography>
      <Card>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Settings placeholder (we can build this later).
        </Typography>
      </Card>
    </Box>
  );
}
