import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Chip, LinearProgress } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import TicketWidget from "../../components/tickets/TicketWidget";
import Card from "../../../components/ui/Card.jsx";
import {
  currentProject,
  clientTickets,
  aiBlockerTickets,
} from "../../data/devWorkspaceMock";
import { loadUserTickets } from "../../data/ticketStore";

export default function DevDashboardHome() {
  const [userTickets, setUserTickets] = useState(() => loadUserTickets());

  useEffect(() => {
    const id = setInterval(() => setUserTickets(loadUserTickets()), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <DevLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: -0.4 }}>
            Developer Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)", mt: 0.5 }}>
            Overview of your current project, tickets and AI detected blockers.
          </Typography>
        </Box>
        <Chip
          label="SaaS UI Theme"
          size="small"
          sx={{
            bgcolor: "rgba(124,92,255,0.16)",
            color: "#e7e9ee",
            border: "1px solid rgba(124,92,255,0.25)",
            fontWeight: 900,
            letterSpacing: 0.3
          }}
        />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" }, gap: 3 }}>
        <Box sx={{ lg: { gridColumn: "span 1" } }}>
          <Link to={`/dev/project/${currentProject.id}`} style={{ textDecoration: "none" }}>
            <Card
              sx={{
                p: 2.5,
                cursor: "pointer",
                transition: "transform 180ms ease, border-color 180ms ease, background 180ms ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  borderColor: "rgba(124,92,255,0.28)"
                }
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                    Current Project
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: -0.3 }}>
                    {currentProject.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
                    Code: <strong>{currentProject.code}</strong> • Due: <strong>{currentProject.dueDate}</strong>
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right", minWidth: "100px" }}>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                    Progress
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: -0.3 }}>
                    {currentProject.progress}%
                  </Typography>
                </Box>
              </Box>

              <Box>
                <LinearProgress
                  variant="determinate"
                  value={currentProject.progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      background: "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.9))"
                    }
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)", mt: 1, display: "block" }}>
                Click to open project workspace
              </Typography>
            </Card>
          </Link>
        </Box>

        <Box sx={{ lg: { gridColumn: "span 2" }, display: "flex", flexDirection: "column", gap: 3 }}>
          <TicketWidget
            title="Client Tickets"
            hint="Created from client email or direct messages"
            tickets={clientTickets}
          />

          <TicketWidget
            title="AI Blocker Tickets"
            hint="Created from chat blocker flows + manual issue chats"
            tickets={[...userTickets, ...aiBlockerTickets]}
          />

          {userTickets.length > 0 && (
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
              Tip: Tickets created from issue chats appear under AI Blocker Tickets.
            </Typography>
          )}
        </Box>
      </Box>
    </DevLayout>
  );
}
