import React, { useEffect, useMemo, useState } from "react";
import { loadProfile, updateProfile, loadProfileFromBackendSafe, syncProfileToBackend } from "../../data/profileStore";
import useApi from "../../../hooks/useApi.jsx";

function makeSkillId(name) {
  const base = name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 18);
  return `SK-${base}-${Date.now().toString().slice(-4)}`;
}

export default function DevProfile() {
  const api = useApi();
  const initial = useMemo(() => loadProfile(), []);

  const [profile, setProfile] = useState(initial);
  const [statusMsg, setStatusMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [showSkillToast, setShowSkillToast] = useState(false);
  const [showPasswordToast, setShowPasswordToast] = useState(false);

  // Try to hydrate from backend (if developer logged in via shared login)
  useEffect(() => {
    (async () => {
      const merged = await loadProfileFromBackendSafe();
      setProfile(merged);
    })();
  }, []);

  // skills
  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(3);

  // password
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const saveBasic = () => {
    setIsSaving(true);
    setSaveStatus(null);
    const next = updateProfile(() => ({ ...profile }));
    setProfile(next);
    setStatusMsg("Saving...");
    (async () => {
      try {
        const synced = await syncProfileToBackend(next);
        setProfile(synced);
        setStatusMsg("✓ Profile saved successfully!");
        setSaveStatus('success');
        setShowToast(true);
      } catch {
        setStatusMsg("⚠ Saved locally (backend sync failed).");
        setSaveStatus('error');
      } finally {
        setIsSaving(false);
        setTimeout(() => {
          setStatusMsg("");
          setSaveStatus(null);
        }, 3500);
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
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
    const skill = { id: makeSkillId(name), name, level: Number(newSkillLevel) || 3 };
    const next = { ...profile, skills: [skill, ...profile.skills] };
    const saved = updateProfile(() => next);
    setProfile(saved);
    setNewSkill("");
    setNewSkillLevel(3);
    setShowSkillToast(true);

    // fire-and-forget sync
    syncProfileToBackend(saved).catch(() => {});
    
    setTimeout(() => {
      setShowSkillToast(false);
    }, 3000);
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
    if (newPw.length < 6) {
      setPwMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg("New password and confirm password do not match.");
      return;
    }

    (async () => {
      try {
        await api.post("/auth/change-password", {
          currentPassword: oldPw,
          newPassword: newPw,
        });

        setOldPw("");
        setNewPw("");
        setConfirmPw("");
        setPwMsg("Password updated successfully.");
        setShowPasswordToast(true);
        setTimeout(() => {
          setShowPasswordToast(false);
        }, 3000);
      } catch (err) {
        setPwMsg(
          err?.response?.data?.message ||
            "Failed to update password. Please try again."
        );
      }
    })();
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Developer Profile</h2>
          <p className="text-sm text-slate-300 mt-1">
            Full profile details used for developer matching, workload tracking, and AI assignment.
          </p>
        </div>
        {statusMsg && (
          <span
            className={`chip font-semibold ${
              saveStatus === 'success'
                ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                : saveStatus === 'error'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
            }`}
          >
            {statusMsg}
          </span>
        )}
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
            <div>
              <label className="text-xs text-slate-400">Specialization</label>
              <input
                className="input mt-1"
                value={profile.specialization || ""}
                onChange={(e) => setProfile((p) => ({ ...p, specialization: e.target.value }))}
                placeholder="Frontend, Backend, Mobile, DevOps"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Timezone</label>
              <input
                className="input mt-1"
                value={profile.timezone || ""}
                onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
                placeholder="Asia/Colombo"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Availability</label>
              <select
                className="input mt-1"
                value={profile.availabilityStatus || "AVAILABLE"}
                onChange={(e) => setProfile((p) => ({ ...p, availabilityStatus: e.target.value }))}
              >
                <option value="AVAILABLE">Available</option>
                <option value="LIMITED">Limited</option>
                <option value="BUSY">Busy</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Weekly capacity hours</label>
              <input
                type="number"
                min="1"
                className="input mt-1"
                value={profile.weeklyCapacityHours ?? 40}
                onChange={(e) => setProfile((p) => ({ ...p, weeklyCapacityHours: Number(e.target.value) || 40 }))}
                placeholder="40"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Years of experience</label>
              <input
                type="number"
                min="0"
                className="input mt-1"
                value={profile.yearsOfExperience ?? 1}
                onChange={(e) => setProfile((p) => ({ ...p, yearsOfExperience: Number(e.target.value) || 0 }))}
                placeholder="1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Experience level</label>
              <select
                className="input mt-1"
                value={profile.experienceLevel || "JUNIOR"}
                onChange={(e) => setProfile((p) => ({ ...p, experienceLevel: e.target.value }))}
              >
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid</option>
                <option value="SENIOR">Senior</option>
              </select>
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

          <button 
            type="button" 
            onClick={saveBasic} 
            disabled={isSaving}
            className={`mt-4 btn-primary flex items-center gap-2 ${
              isSaving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Saving...
              </>
            ) : saveStatus === 'success' ? (
              <>
                <span>✓</span>
                Saved
              </>
            ) : (
              'Save profile'
            )}
          </button>
        </div>

        {/* Skills */}
        <div className="glass-card p-5">
          <h3 className="text-lg font-bold mb-3">Skills</h3>
          <p className="text-xs text-slate-400 mb-3">
            Add skills you have and set your proficiency level for better assignment matching.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2">
            <input
              className="input"
              placeholder="Add a skill (e.g., Spring Boot)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSkill();
              }}
            />
            <select
              className="input"
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(Number(e.target.value))}
            >
              <option value={1}>Level 1</option>
              <option value={2}>Level 2</option>
              <option value={3}>Level 3</option>
              <option value={4}>Level 4</option>
              <option value={5}>Level 5</option>
            </select>
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
                {s.name} · L{s.level ?? 3}
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
            Change your account password. Use a strong password with at least 6 characters.
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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 border border-green-400/30">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Profile Updated Successfully!</p>
              <p className="text-xs text-green-100">Your changes have been saved.</p>
            </div>
          </div>
        </div>
      )}

      {/* Skill Added Toast */}
      {showSkillToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 border border-blue-400/30">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Skill Added Successfully!</p>
              <p className="text-xs text-blue-100">Your skill has been added to your profile.</p>
            </div>
          </div>
        </div>
      )}

      {/* Password Changed Toast */}
      {showPasswordToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 border border-purple-400/30">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Password Changed Successfully!</p>
              <p className="text-xs text-purple-100">Your password has been updated securely.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

