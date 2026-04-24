import React, { useEffect, useMemo, useState } from "react";
import DevLayout from "../../components/layout/DevLayout";
import { loadProfile, updateProfile, loadProfileFromBackendSafe, syncProfileToBackend } from "../../data/profileStore";

function makeSkillId(name) {
  const base = name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 18);
  return `SK-${base}-${Date.now().toString().slice(-4)}`;
}

export default function DevProfile() {
  const initial = useMemo(() => loadProfile(), []);

  const [profile, setProfile] = useState(initial);
  const [statusMsg, setStatusMsg] = useState("");

  // Try to hydrate from backend (if developer logged in via shared login)
  useEffect(() => {
    (async () => {
      const merged = await loadProfileFromBackendSafe();
      setProfile(merged);
    })();
  }, []);

  // skills
  const [newSkill, setNewSkill] = useState("");

  // password
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
        setStatusMsg("Saved locally (backend sync failed).");
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

    // fire-and-forget sync
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
    setPwMsg("Password updated (UI demo). ");
  };

  return (
    <DevLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Profile</h2>
          <p className="text-sm text-slate-300 mt-1">
            Basic details, skills and password settings.
          </p>
        </div>
        {statusMsg && <span className="chip">{statusMsg}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic profile */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-lg font-bold mb-4">Basic Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400">Full name</label>
              <input
                className="input mt-1"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Email</label>
              <input
                className="input mt-1"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Phone</label>
              <input
                className="input mt-1"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+94..."
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Location</label>
              <input
                className="input mt-1"
                value={profile.location}
                onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                placeholder="Moratuwa, Sri Lanka"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Bio</label>
              <textarea
                className="textarea mt-1"
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Short bio..."
              />
            </div>
          </div>

          <button type="button" onClick={saveBasic} className="mt-4 btn-primary">
            Save profile
          </button>
        </div>

        {/* Skills */}
        <div className="glass-card p-5">
          <h3 className="text-lg font-bold mb-3">Skills</h3>
          <p className="text-xs text-slate-400 mb-3">
            Add skills you have (update later when you learn new skills).
          </p>

          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Add a skill (e.g., Spring Boot)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSkill();
              }}
            />
            <button type="button" onClick={addSkill} className="btn-primary px-4">
              Add
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span
                key={s.id}
                className="chip flex items-center gap-2"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => removeSkill(s.id)}
                  className="text-slate-300 hover:text-white"
                  aria-label={`Remove ${s.name}`}
                >
                  ✕
                </button>
              </span>
            ))}
            {profile.skills.length === 0 && (
              <p className="text-sm text-slate-300">No skills added yet.</p>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="lg:col-span-3 glass-card p-5">
          <h3 className="text-lg font-bold mb-3">Change Password</h3>
          <p className="text-xs text-slate-400 mb-4">
            UI demo only. In a real app this would be handled securely on the server.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400">Old password</label>
              <input
                type="password"
                className="input mt-1"
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">New password</label>
              <input
                type="password"
                className="input mt-1"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Confirm new password</label>
              <input
                type="password"
                className="input mt-1"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={changePassword} className="btn-primary">
              Update password
            </button>
            {pwMsg && <span className="text-sm text-slate-200">{pwMsg}</span>}
          </div>
        </div>
      </div>
    </DevLayout>
  );
}
