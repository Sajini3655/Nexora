import { Paper, Box, Typography } from "@mui/material";

export default function StatCard({ title, value, icon, badge }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 4,
        background: "var(--nx-card)",
        border: "1px solid var(--nx-border)",
        boxShadow: "var(--nx-shadow)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "color-mix(in srgb, var(--nx-purple) 12%, transparent)",
              color: "var(--nx-purple)",
              border: "1px solid color-mix(in srgb, var(--nx-purple) 24%, transparent)",
            }}
          >
            {icon}
          </Box>
          <Typography sx={{ fontWeight: 800, color: "var(--nx-text-soft)" }}>{title}</Typography>
        </Box>

        <Box sx={{ textAlign: "right", minWidth: 0 }}>
          <Typography sx={{ fontWeight: 950, fontSize: "2rem", lineHeight: 1, color: "var(--nx-text)" }}>
            {value}
          </Typography>
          {badge ? (
            <Typography
              sx={{
                mt: 1,
                display: "inline-flex",
                borderRadius: 999,
                px: 1.25,
                py: 0.35,
                fontSize: 11,
                fontWeight: 800,
                background: "color-mix(in srgb, var(--nx-panel-2) 80%, transparent)",
                color: "var(--nx-muted)",
                border: "1px solid var(--nx-border)",
              }}
            >
              {badge}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}
