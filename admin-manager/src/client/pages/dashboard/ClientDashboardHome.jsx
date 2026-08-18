import React, { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { Link } from "react-router-dom";

import { enrichProjectsWithTickets } from "../../services/clientService";
import { useClientProjects, useClientTickets } from "../../services/useClient";
import ClientProjectTimeline from "../../components/dashboard/ClientProjectTimeline.jsx";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import DashboardHero from "../../../components/ui/DashboardHero.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

const isChatTicket = (ticket) => {
  const source = String(ticket?.sourceChannel ?? ticket?.source_channel ?? ticket?.createdVia ?? "").trim().toUpperCase();
  const category = String(ticket?.category ?? "").trim().toLowerCase();
  const title = String(ticket?.title ?? "").trim().toLowerCase();

  return (
    source === "CHAT" ||
    source === "CHAT_SUMMARY" ||
    source === "CHATBOX" ||
    category === "chat" ||
    title.includes("chat ticket")
  );
};

const surfaceSx = {
  p: { xs: 1.5, sm: 2.2 },
  borderRadius: 3,
  bgcolor: "var(--nx-panel)",
  border: "1px solid var(--nx-border)",
  boxShadow: "none",
};

const secondarySurfaceSx = {
  p: { xs: 1.35, sm: 1.8 },
  borderRadius: 2,
  bgcolor: "var(--nx-panel-2)",
  border: "1px solid var(--nx-border)",
  boxShadow: "none",
};

export default function ClientDashboardHome() {
  const { data: projects = [], isLoading: projectsLoading } = useClientProjects();
  const { data: tickets = [], isLoading: loading, isFetching: refreshing, error: queryError, refetch: refetchTickets } = useClientTickets();
  const { moduleAccess } = useAuth();
  const canViewTickets = Boolean(moduleAccess?.TICKETS);

  const error = queryError?.message || "";
  const projectSummaries = useMemo(() => enrichProjectsWithTickets(projects, tickets), [projects, tickets]);

  const liveTopics = useMemo(
    () => ["/topic/client.dashboard", "/topic/tickets", "/topic/tasks"],
    []
  );

  useLiveRefresh(liveTopics, refetchTickets, { debounceMs: 900 });

  const stats = useMemo(() => {
    return [
      {
        title: "Open Tickets",
        value: tickets.filter((ticket) => (ticket.status === "Open" || ticket.status === "In Progress") && !isChatTicket(ticket)).length,
      },
      {
        title: "In Progress",
        value: tickets.filter((ticket) => ticket.status === "In Progress" && !isChatTicket(ticket)).length,
      },
      {
        title: "Resolved",
        value: tickets.filter((ticket) => ticket.status === "Done").length,
      },
      {
        title: "Projects",
        value: projects.length,
      },
    ];
  }, [tickets, projects]);

  const recentTickets = useMemo(
    () => tickets.filter((ticket) => !isChatTicket(ticket)).slice(0, 5),
    [tickets]
  );

  const activeProject = projectSummaries[0] || null;
  const activeProjectTickets = useMemo(() => {
    if (!activeProject) return [];
    return tickets.filter((ticket) => String(ticket.projectId ?? "") === String(activeProject.id));
  }, [activeProject, tickets]);

  const noProjects = !projectsLoading && projectSummaries.length === 0;

  return (
    <Stack
      spacing={3}
      sx={{
        "& .MuiTypography-caption": { fontSize: 13.5 },
        "& .MuiTypography-body2": { fontSize: 14.5 },
      }}
    >
      <DashboardHero
        icon={<SupportAgentRoundedIcon />}
        title="Client Dashboard"
        actionLabel={canViewTickets ? "View Tickets" : undefined}
        component={canViewTickets ? Link : undefined}
        actionTo={canViewTickets ? "/client/tickets" : undefined}
      />

      {error ? <Alert severity="warning">{error}</Alert> : null}

      {refreshing && !loading ? (
        <LinearProgress
          sx={{
            height: 4,
            borderRadius: 999,
            bgcolor: "var(--nx-panel-2)",
            "& .MuiLinearProgress-bar": { bgcolor: "var(--nx-purple)" },
          }}
        />
      ) : null}

      {loading || projectsLoading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 260 }}>
          <CircularProgress sx={{ color: "var(--nx-purple)" }} />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {stats.map((stat) => (
              <StatCard key={stat.title} title={stat.title} value={stat.value} />
            ))}
          </Box>

          <Paper sx={surfaceSx}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 17, color: "var(--nx-text)" }}>
                  Your Projects
                </Typography>
              </Box>
            </Box>

            {noProjects ? (
              <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
                No projects assigned to your account yet.
              </Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 1.5 }}>
                {projectSummaries.map((project) => (
                  <Paper key={project.id} sx={secondarySurfaceSx}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                      <Box>
                        <Typography sx={{ fontWeight: 900, color: "var(--nx-text)" }}>{project.name}</Typography>
                        <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                          Manager: {project.manager || "Client Support"} • {project.totalTasks || 0} tasks
                        </Typography>
                      </Box>
                      <StatusBadge label={project.status} />
                    </Box>

                    <Box sx={{ mt: 1.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={project.progress || 0}
                        sx={{
                          height: 7,
                          borderRadius: 999,
                          bgcolor: "var(--nx-panel)",
                          "& .MuiLinearProgress-bar": { bgcolor: "var(--nx-purple)" },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: "var(--nx-muted)", mt: 0.8, display: "block" }}>
                        {project.progress || 0}% complete • {project.completedTasks || 0}/{project.totalTasks || 0} tasks • Last update {project.eta || "-"}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>

          {noProjects ? null : <ClientProjectTimeline project={activeProject} tickets={activeProjectTickets} />}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
            <Panel title="Recent Tickets" actionText="View all" actionTo="/client/tickets">
              {recentTickets.length === 0 ? (
                <EmptyText>No tickets found.</EmptyText>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Box sx={{ minWidth: 650 }}>
                    <TableHeader columns="1.4fr 1fr 1fr 0.8fr" />

                    {recentTickets.map((ticket) => (
                      <Box
                        key={ticket.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr",
                          gap: 1.5,
                          alignItems: "center",
                          py: 1.4,
                          borderBottom: "1px solid var(--nx-border)",
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, fontSize: 15, color: "var(--nx-text)" }}>
                          {ticket.title}
                        </Typography>

                        <Typography sx={{ color: "var(--nx-muted)", fontSize: 14 }}>
                          {ticket.category || "-"}
                        </Typography>

                        <StatusChip status={ticket.status} />

                        <Typography sx={{ color: "var(--nx-muted)", fontSize: 14 }}>
                          {ticket.updatedAt}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Panel>

            <Panel title="Current Project">
              {!activeProject ? (
                <EmptyText>No projects yet.</EmptyText>
              ) : (
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 20, color: "var(--nx-text)" }}>
                    {activeProject.name}
                  </Typography>

                  <Typography sx={{ color: "var(--nx-muted)", fontSize: 14, mt: 0.5 }}>
                    Status: {activeProject.status}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                      <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                        Progress
                      </Typography>

                      <Typography variant="caption" sx={{ color: "var(--nx-text-soft)" }}>
                        {activeProject.progress}%
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={activeProject.progress}
                      sx={{
                        height: 7,
                        borderRadius: 999,
                        bgcolor: "var(--nx-panel-2)",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: "var(--nx-purple)",
                        },
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Panel>
          </Box>
        </>
      )}
    </Stack>
  );
}

function StatCard({ title, value }) {
  return (
    <Paper sx={surfaceSx}>
      <Typography sx={{ color: "var(--nx-muted)", fontWeight: 800, fontSize: 13 }}>
        {title}
      </Typography>

      <Typography
        sx={{
          fontWeight: 900,
          mt: 0.8,
          color: "var(--nx-text)",
          fontSize: 30,
          lineHeight: 1.15,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function Panel({ title, children, actionText, actionTo }) {
  return (
    <Paper sx={surfaceSx}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: { xs: "flex-start", sm: "center" }, flexWrap: "wrap", mb: 1.5 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 17, color: "var(--nx-text)" }}>
          {title}
        </Typography>

        {actionText && actionTo ? (
          <Button
            component={Link}
            to={actionTo}
            size="small"
            sx={{
              textTransform: "none",
              color: "var(--nx-purple)",
              fontWeight: 800,
              fontSize: 13.5,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {actionText}
          </Button>
        ) : null}
      </Box>

      {children}
    </Paper>
  );
}

function TableHeader({ columns }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: 1.5,
        pb: 1,
        borderBottom: "1px solid var(--nx-border)",
      }}
    >
      {"Title,Category,Status,Updated".split(",").map((heading) => (
        <Typography
          key={heading}
          variant="caption"
          sx={{
            color: "var(--nx-muted)",
            fontWeight: 900,
            textTransform: "uppercase",
            fontSize: 12,
          }}
        >
          {heading}
        </Typography>
      ))}
    </Box>
  );
}

function StatusChip({ status }) {
  return <StatusBadge label={status} />;
}

function EmptyText({ children }) {
  return (
    <Typography variant="body2" sx={{ color: "var(--nx-muted)", fontSize: 14 }}>
      {children}
    </Typography>
  );
}