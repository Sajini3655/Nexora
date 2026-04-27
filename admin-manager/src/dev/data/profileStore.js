// src/data/profileStore.js
// Simple UI-only profile persistence (localStorage)

// In the combined project, we also sync the developer profile (especially skills)
// to the shared backend so the Manager "AI Task Assignment" can use it.
import { API_BASE_URL } from "../../utils/constants";

const STORAGE_KEY = "nexora_dev_profile_v1";

const API_BASE = `${API_BASE_URL}/api`;

const defaultProfile = {
  name: "You",
  email: "you@example.com",
  phone: "",
  location: "",
  bio: "",
  skills: [
    { id: "SK-1", name: "React", level: 3 },
    { id: "SK-2", name: "Node.js", level: 3 },
  ],
  experienceLevel: "JUNIOR",
  capacityPoints: 20,
  // UI demo only (do NOT store real passwords like this in real apps)
  password: "password",
};

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadProfile() {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? safeParse(raw) : null;
  const p = parsed && typeof parsed === "object" ? parsed : defaultProfile;

  return {
    ...defaultProfile,
    ...p,
    skills: Array.isArray(p.skills) ? p.skills : defaultProfile.skills,
  };
}

export function saveProfile(profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function updateProfile(updater) {
  const current = loadProfile();
  const next = updater(current);
  saveProfile(next);
  return next;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res;
}

// Try to load profile from backend. Falls back to local profile if not available.
export async function loadProfileFromBackendSafe() {
  try {
    const res = await apiFetch("/developer/profile", { method: "GET" });
    const data = await res.json();
    // convert backend format -> UI profile format
    const local = loadProfile();
    const skills = Array.isArray(data.skills)
      ? data.skills.map((s, idx) => ({
          id: `SK-${idx + 1}-${Date.now().toString().slice(-4)}`,
          name: s.name,
          level: s.level ?? 3,
        }))
      : local.skills;

    const merged = {
      ...local,
      name: data.name ?? local.name,
      email: data.email ?? local.email,
      phone: data.phone ?? local.phone,
      location: data.location ?? local.location,
      bio: data.bio ?? local.bio,
      experienceLevel: data.experienceLevel ?? local.experienceLevel,
      capacityPoints: data.capacityPoints ?? local.capacityPoints,
      skills,
    };
    saveProfile(merged);
    return merged;
  } catch {
    return loadProfile();
  }
}

// Sync local profile to backend so manager-side recommendation uses latest skills.
export async function syncProfileToBackend(profile) {
  const payload = {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    bio: profile.bio,
    experienceLevel: profile.experienceLevel || "JUNIOR",
    capacityPoints: profile.capacityPoints || 20,
    skills: (profile.skills || []).map((s) => ({
      name: s.name,
      level: s.level ?? 3,
    })),
  };

  const res = await apiFetch("/developer/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  // write back to local storage (keeps consistent)
  const merged = {
    ...profile,
    name: data.name ?? profile.name,
    email: data.email ?? profile.email,
    phone: data.phone ?? profile.phone,
    location: data.location ?? profile.location,
    bio: data.bio ?? profile.bio,
    experienceLevel: data.experienceLevel ?? profile.experienceLevel,
    capacityPoints: data.capacityPoints ?? profile.capacityPoints,
  };
  saveProfile(merged);
  return merged;
}

