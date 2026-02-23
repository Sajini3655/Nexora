import React from "react";
import { Box, Typography } from "@mui/material";
import Card from "./Card";

export default function StatCard({ label, value, hint, icon }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.2,
            display: "grid",
            placeItems: "center",
            background: "rgba(124,92,255,0.14)",
            border: "1px solid rgba(124,92,255,0.22)"
          }}
        >
          {icon}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: 22, lineHeight: 1.1 }}>
            {value}
          </Typography>
          {hint ? (
            <Typography variant="caption" sx={{ opacity: 0.65 }}>
              {hint}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Card>
  );
}
