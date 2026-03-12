import React, { useEffect, useState } from "react";
import { Box, Grid, LinearProgress, Typography, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card.jsx";
import TicketWidget from "../../components/developer/TicketWidget.jsx";
import { currentProject, clientTickets, aiBlockerTickets } from "../../dev/data/devWorkspaceMock";
import { loadUserTickets } from "../../dev/data/ticketStore";

export default function DevDashboardHome() {
  const navigate = useNavigate();
  const [userTickets, setUserTickets] = useState(() => loadUserTickets());

  useEffect(() => {
    const id = setInterval(() => setUserTickets(loadUserTickets()), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Developer Dashboard
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.72, mt: 0.6 }}>
            Overview of your current project, tickets and AI detected blockers.
          </Typography>
        </Box>
        <Chip size="small" label="Developer" />
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={4}>
          <Card
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/developer/project/${currentProject.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/developer/project/${currentProject.id}`);
              }
            }}
            sx={{
              cursor: "pointer",
              "&:hover": { backgroundColor: "rgba(15,18,35,0.84)" },
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Current Project
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 950, mt: 0.5 }}>
              {currentProject.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.8 }}>
              Code: <b>{currentProject.code}</b> • Due: <b>{currentProject.dueDate}</b>
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Progress
                </Typography>
                <Typography sx={{ fontWeight: 950 }}>{currentProject.progress}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={currentProject.progress}
                sx={{ mt: 1, height: 8, borderRadius: 999 }}
              />
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: "block" }}>
                Click to open project workspace
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TicketWidget
              title="Client Tickets"
              hint="Created from client email or direct messages"
              tickets={clientTickets}
            />

            <TicketWidget
              title="AI Blocker Tickets"
              hint="Created from issue chats + summaries"
              tickets={[...userTickets, ...aiBlockerTickets]}
            />

            {userTickets.length > 0 ? (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Tip: Tickets created from issue chats appear under AI Blocker Tickets.
              </Typography>
            ) : null}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
