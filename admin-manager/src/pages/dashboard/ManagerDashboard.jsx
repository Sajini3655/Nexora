// src/pages/dashboard/ManagerDashboard.jsx
import React, { useEffect,useState } from "react";
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useLocation,useNavigate } from "react-router-dom";



export default function ManagerDashboard() {

  const location = useLocation();

useEffect(() => {
  const target = location.state?.scrollTo;
  if (!target) return;

  const t = setTimeout(() => {
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);

  return () => clearTimeout(t);
}, [location.state]);

  const navigate = useNavigate();

  const projects = [
    { id: 1, name: "Project Alpha", progress: 60, status: "Active", developers: ["Alice", "Bob"], dueDate: "2026-03-15" },
    { id: 2, name: "Project Beta", progress: 20, status: "Pending", developers: ["Charlie"], dueDate: "2026-03-30" },
    { id: 3, name: "Project Gamma", progress: 100, status: "Completed", developers: ["Alice", "David"], dueDate: "2026-02-28" },
  ];

  // Tickets now include the projectId
  const [clientTickets, setClientTickets] = useState([
    { id: 101, title: "Fix login bug", description: "Login fails for some users", projectId: 1 },
    { id: 102, title: "Add new feature", description: "Add export to PDF", projectId: 3 },
  ]);

  const [chatTickets, setChatTickets] = useState([
    { id: 201, title: "Summarize last sprint", description: "AI to summarize tasks", projectId: 1 },
    { id: 202, title: "Blocker detected", description: "Deployment blocked on QA", projectId: 2 },
  ]);

  const developers = ["Alice", "Bob", "Charlie", "David"];

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignedDeveloper, setAssignedDeveloper] = useState("");

  const secondaryText = "rgba(255,255,255,0.72)";
  const tertiaryText = "rgba(255,255,255,0.56)";

  const glassBoxStyle = {
    p: 2,
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
    transition: "transform 120ms ease, box-shadow 120ms ease",
    "&:hover": { transform: "translateY(-1px)", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" },
  };

  const statBoxStyle = {
    p: 2,
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255,255,255,0.1)",
    textAlign: "left",
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "#1976d2";
      case "Pending": return "#ff9800";
      case "Completed": return "#4caf50";
      default: return "#1976d2";
    }
  };

  const handleOpenModal = (ticket, type) => {
    setSelectedTicket({ ...ticket, type }); // save ticket type for later removal
    setAssignedDeveloper("");
    setOpenModal(true);
  };

  const handleAssign = () => {
    console.log(`Ticket ${selectedTicket.id} assigned to ${assignedDeveloper}`);
    // Remove assigned ticket from state
    if (selectedTicket.type === "client") {
      setClientTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
    } else if (selectedTicket.type === "chat") {
      setChatTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
    }
    setOpenModal(false);
  };

  const getProjectName = (projectId) => projects.find(p => p.id === projectId)?.name || "Unknown Project";

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 0.75, fontWeight: 950, letterSpacing: -0.4 }}>
        Manager Dashboard
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: tertiaryText }}>
        Overview of projects and incoming tickets.
      </Typography>

      {/* Key Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Box sx={statBoxStyle}>
            <Typography variant="body2" sx={{ color: tertiaryText, fontWeight: 800 }}>
              Total Projects
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 950, mt: 0.5 }}>
              {projects.length}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={statBoxStyle}>
            <Typography variant="body2" sx={{ color: tertiaryText, fontWeight: 800 }}>
              Active Projects
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 950, mt: 0.5 }}>
              {projects.filter(p => p.status === "Active").length}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={statBoxStyle}>
            <Typography variant="body2" sx={{ color: tertiaryText, fontWeight: 800 }}>
              Total Tickets
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 950, mt: 0.5 }}>
              {clientTickets.length + chatTickets.length}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Projects */}
      <Typography id="projectsSection" variant="h5" sx={{ mb: 2, fontWeight: 900 }}>
        Projects
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {projects.map(proj => (
          <Grid item xs={12} md={4} key={proj.id}>
            <Tooltip
              title={
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="caption" sx={{ display: "block", fontWeight: 900 }}>
                    Click for details
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Developers: {proj.developers.join(", ")}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Due: {proj.dueDate}
                  </Typography>
                </Box>
              }
              arrow
            >
              <Box sx={glassBoxStyle} onClick={() => navigate(`/manager/projects/${proj.id}`)}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
                  <Chip
                    label={proj.status}
                    size="small"
                    sx={{ bgcolor: getStatusColor(proj.status), color: "#fff", fontWeight: 900 }}
                  />
                  <Typography variant="caption" sx={{ color: tertiaryText, fontWeight: 800 }}>
                    Due {proj.dueDate}
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.2, mb: 0.5 }}>
                  {proj.name}
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryText, mb: 1 }}>
                  {proj.developers.length} developer{proj.developers.length === 1 ? "" : "s"} assigned
                </Typography>
                <LinearProgress variant="determinate" value={proj.progress} sx={{ mt:1, mb:1, height:8, borderRadius:5, backgroundColor:"rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar":{backgroundColor:getStatusColor(proj.status)}}}/>
                <Typography variant="body2" sx={{ color: secondaryText }}>
                  {proj.progress}% complete
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {/* Tickets */}
      <Typography id="ticketsSection" variant="h5" sx={{ mb: 2, fontWeight: 900 }}>
        Tickets
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 900 }}>Client Tickets</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {clientTickets.length === 0 ? (
              <Box sx={{ ...glassBoxStyle, cursor: "default" }}>
                <Typography variant="body2" sx={{ color: secondaryText }}>
                  No client tickets right now.
                </Typography>
              </Box>
            ) : (
              clientTickets.map(ticket => (
                <Box key={ticket.id} sx={glassBoxStyle} onClick={() => handleOpenModal(ticket, "client")}>
                  <Typography variant="body1" sx={{ fontWeight: 900, mb: 0.25 }}>
                    {ticket.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: secondaryText }}>
                    {getProjectName(ticket.projectId)}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 900 }}>Chat Tickets</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {chatTickets.length === 0 ? (
              <Box sx={{ ...glassBoxStyle, cursor: "default" }}>
                <Typography variant="body2" sx={{ color: secondaryText }}>
                  No chat tickets right now.
                </Typography>
              </Box>
            ) : (
              chatTickets.map(ticket => (
                <Box key={ticket.id} sx={glassBoxStyle} onClick={() => handleOpenModal(ticket, "chat")}>
                  <Typography variant="body1" sx={{ fontWeight: 900, mb: 0.25 }}>
                    {ticket.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: secondaryText }}>
                    {getProjectName(ticket.projectId)}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Modal for Ticket */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Assign Developer</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
            {selectedTicket?.title} — {getProjectName(selectedTicket?.projectId)}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color:"#666" }}>{selectedTicket?.description}</Typography>

          <FormControl fullWidth>
            <InputLabel id="assign-label">Developer</InputLabel>
            <Select
              labelId="assign-label"
              value={assignedDeveloper}
              onChange={(e) => setAssignedDeveloper(e.target.value)}
              label="Developer"
            >
              {developers.map(dev => <MenuItem key={dev} value={dev}>{dev}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button disabled={!assignedDeveloper} variant="contained" onClick={handleAssign}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
