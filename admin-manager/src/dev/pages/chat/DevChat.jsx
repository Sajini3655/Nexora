import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import ChatBox from "./src/ChatBox";
import { deriveSingleProject, fetchDeveloperProfile, fetchDeveloperTasks } from "../../services/developerApi";

export default function DevChat() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [profile, setProfile] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [profileData, taskData] = await Promise.all([
          fetchDeveloperProfile(),
          fetchDeveloperTasks(),
        ]);

        if (!active) return;

        const derivedProject = deriveSingleProject(Array.isArray(taskData) ? taskData : []);
        const nextProjectId = String(projectId || derivedProject?.id || "");

        setProfile(profileData);
        setProject(derivedProject);

        if (derivedProject?.id && (!projectId || String(projectId) !== String(derivedProject.id))) {
          navigate(`/dev/chat/${derivedProject.id}`, { replace: true });
        }

        if (!nextProjectId) {
          setError("No project is assigned to this developer.");
        }
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load project chat.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [navigate, projectId]);

  const currentProjectId = useMemo(() => {
    if (projectId) return String(projectId);
    return project?.id ? String(project.id) : "";
  }, [project, projectId]);

  if (loading) {
    return (
      <DevLayout>
        <Box sx={{ minHeight: "45vh", display: "grid", placeItems: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography color="text.secondary">Loading project chat...</Typography>
          </Stack>
        </Box>
      </DevLayout>
    );
  }

  if (error) {
    return (
      <DevLayout>
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </DevLayout>
    );
  }

  if (!currentProjectId || !profile?.userId) {
    return (
      <DevLayout>
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          Project chat is not available yet.
        </Alert>
      </DevLayout>
    );
  }

  return (
    <DevLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
        <Box>
          <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
            Project chat
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>
            {project?.name || `Project ${currentProjectId}`}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
            Chat is connected to the backend websocket and tied to your project session.
          </Typography>
        </Box>
      </Box>

      <ChatBox
        projectId={currentProjectId}
        currentUserId={String(profile.userId)}
        currentUserName={profile.name || profile.email || "Developer"}
        onSummary={(data) => setSummary(data)}
      />

      {summary ? (
        <Box sx={{ mt: 3 }}>
          <Alert
            severity="info"
            sx={{ borderRadius: 3, backgroundColor: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.20)" }}
            action={
              <Box
                component="button"
                type="button"
                onClick={() => navigate("/dev/tickets/new", { state: { summary, projectId: currentProjectId } })}
                sx={{
                  border: 0,
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.8,
                  cursor: "pointer",
                  fontWeight: 800,
                  background: "rgba(124,92,255,0.16)",
                  color: "#e7e9ee",
                  borderColor: "rgba(124,92,255,0.25)",
                }}
              >
                Create ticket
              </Box>
            }
          >
            Chat summary generated. Use it to open a backend ticket if the conversation exposed blockers.
          </Alert>
        </Box>
      ) : null}
    </DevLayout>
  );
}
