import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";

import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";

import { loadProfile, updateProfile, loadProfileFromBackendSafe, syncProfileToBackend } from "../../dev/data/profileStore";

function makeSkillId(name) {
  const base = name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 18);
  return `SK-${base}-${Date.now().toString().slice(-4)}`;
}

export default function DevProfile() {
  const initial = useMemo(() => loadProfile(), []);
  const [profile, setProfile] = useState(initial);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    (async () => {
      const merged = await loadProfileFromBackendSafe();
      setProfile(merged);
    })();
  }, []);

  const [newSkill, setNewSkill] = useState("");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const saveBasic = () => {
    const next = updateProfile(() => ({ ...profile }));
    setProfile(next);
    setStatusMsg("Saving...");
    (async () => {
      try {
        const synced = await syncProfileToBackend(next);
        setProfile(synced);
        setStatusMsg("Profile saved.");
      } catch {
        setStatusMsg("Saved locally (backend sync failed). ");
      } finally {
        setTimeout(() => setStatusMsg(""), 2200);
      }
    })();
  };

  const addSkill = () => {
    const name = newSkill.trim();
    if (!name) return;
    if (profile.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setNewSkill("");
      return;
    }
    const skill = { id: makeSkillId(name), name, level: 3 };
    const next = { ...profile, skills: [skill, ...profile.skills] };
    const saved = updateProfile(() => next);
    setProfile(saved);
    setNewSkill("");
    syncProfileToBackend(saved).catch(() => {});
  };

  const removeSkill = (id) => {
    const next = { ...profile, skills: profile.skills.filter((s) => s.id !== id) };
    const saved = updateProfile(() => next);
    setProfile(saved);
    syncProfileToBackend(saved).catch(() => {});
  };

  const changePassword = () => {
    setPwMsg("");
    if (!oldPw || !newPw || !confirmPw) {
      setPwMsg("Fill all password fields.");
      return;
    }
    if (oldPw !== profile.password) {
      setPwMsg("Old password is incorrect.");
      return;
    }
    if (newPw.length < 6) {
      setPwMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg("New password and confirm password do not match.");
      return;
    }
    const next = { ...profile, password: newPw };
    const saved = updateProfile(() => next);
    setProfile(saved);
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    setPwMsg("Password updated (UI demo).");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Profile
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.72, mt: 0.6 }}>
            Basic details, skills and password settings.
          </Typography>
        </Box>
        {statusMsg ? <Chip size="small" label={statusMsg} /> : null}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2.5 }}>
        <Card>
          <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.5 }}>
            Basic Details
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
            <Input
              label="Full name"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              label="Email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
            <Input
              label="Phone"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
            <Input
              label="Location"
              value={profile.location}
              onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
            />
            <Input
              label="Bio"
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              multiline
              minRows={4}
              sx={{ gridColumn: { xs: "1", md: "span 2" } }}
            />
          </Box>

          <Button sx={{ mt: 2 }} onClick={saveBasic}>
            Save profile
          </Button>
        </Card>

        <Card>
          <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.2 }}>
            Skills
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Add skills you have (used by manager-side AI assignment).
          </Typography>

          <Stack direction="row" spacing={1.2} sx={{ mt: 1.5 }}>
            <Input
              label="New skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSkill();
              }}
            />
            <Button onClick={addSkill}>Add</Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {profile.skills.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                onDelete={() => removeSkill(s.id)}
                sx={{ fontWeight: 800 }}
              />
            ))}
          </Box>
          {profile.skills.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 1 }}>
              No skills added yet.
            </Typography>
          ) : null}
        </Card>
      </Box>

      <Card sx={{ mt: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.2 }}>
          Change Password
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          UI demo only. In a real app this should be handled on the server.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.5, mt: 2 }}>
          <Input label="Old password" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
          <Input label="New password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          <Input label="Confirm new password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
        </Box>

        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Button onClick={changePassword}>Update password</Button>
          {pwMsg ? <Typography variant="body2" sx={{ opacity: 0.85 }}>{pwMsg}</Typography> : null}
        </Box>
      </Card>
    </Box>
  );
}
