import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { fetchClientProfile } from "../../services/clientService";

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchClientProfile().then(setProfile);
  }, []);

  return (
    <>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Profile
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Your client account information.
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
            maxWidth: 620,
          }}
        >
          {!profile ? (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 120 }}>
              <CircularProgress sx={{ color: "#6d5dfc" }} />
            </Box>
          ) : (
            <Stack spacing={1.5}>
              <ProfileRow label="Name" value={profile.name} />
              <ProfileRow label="Email" value={profile.email} />
              <ProfileRow label="Company" value={profile.company} />
              <ProfileRow label="Timezone" value={profile.timezone} />
            </Stack>
          )}
        </Paper>
      </Stack>
    </>
  );
}

function ProfileRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" },
        gap: 1,
        py: 1,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
        {label}
      </Typography>
      <Typography sx={{ color: "#e5e7eb", fontWeight: 700 }}>
        {value || "-"}
      </Typography>
    </Box>
  );
}

