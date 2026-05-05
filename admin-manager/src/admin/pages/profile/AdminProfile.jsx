import React, { useMemo, useState } from "react";
import useApi from "../../../hooks/useApi.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { getActiveRole } from "../../../utils/roleRouting";

export default function AdminProfile() {
  const { user } = useAuth();
  const api = useApi();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const roleLabel = useMemo(() => {
    const role = String(getActiveRole(user) || user?.role || "USER").toUpperCase();
    if (role === "ADMIN") return "Admin";
    if (role === "MANAGER") return "Manager";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }, [user]);

  const createdAtLabel = useMemo(() => {
    if (!user?.createdAt) {
      return "-";
    }

    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString();
  }, [user?.createdAt]);

  async function handleChangePassword(event) {
    event.preventDefault();
    setPwMsg("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMsg("Fill all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPwMsg("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMsg("New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPwMsg("Password updated successfully.");
      setStatusMsg("Security settings updated.");
      window.setTimeout(() => setStatusMsg(""), 2200);
    } catch (err) {
      setPwMsg(
        err?.response?.data?.message ||
          "Failed to update password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">{roleLabel} Profile</h2>
          <p className="text-sm text-slate-300 mt-1">
            Manage your account details and security settings.
          </p>
        </div>
        {statusMsg && <span className="chip">{statusMsg}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-lg font-bold mb-4">Basic Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Full name" value={user?.name} />
            <ReadOnlyField label="Email" value={user?.email} />
            <ReadOnlyField label="Role" value={roleLabel} />
            <ReadOnlyField
              label="Account status"
              value={user?.enabled ? "Account Active" : "Account Disabled"}
            />
            <ReadOnlyField label="User ID" value={user?.id} />
            <ReadOnlyField label="Joined" value={createdAtLabel} />
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-lg font-bold mb-3">Skills</h3>
          <p className="text-xs text-slate-400">
            Skills are currently available for Developer accounts.
          </p>
          <div className="mt-4">
            <span className="chip chip-muted">Not applicable</span>
          </div>
        </div>

        <form
          onSubmit={handleChangePassword}
          className="lg:col-span-3 glass-card p-5"
        >
          <h3 className="text-lg font-bold mb-3">Change Password</h3>
          <p className="text-xs text-slate-400 mb-4">
            Use a strong password with at least 6 characters.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400">Current password</label>
              <input
                type="password"
                className="input mt-1"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">New password</label>
              <input
                type="password"
                className="input mt-1"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Confirm new password</label>
              <input
                type="password"
                className="input mt-1"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Updating..." : "Update password"}
            </button>
            {pwMsg && <span className="text-sm text-slate-200">{pwMsg}</span>}
          </div>
        </form>
      </div>
    </>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="text-xs text-slate-400">{label}</label>
      <input className="input mt-1" value={value || "-"} readOnly />
    </div>
  );
}

