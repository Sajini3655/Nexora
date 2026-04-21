// src/pages/dashboard/ManagerDashboard.jsx
import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
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

  const glassBoxStyle = {
    p: 2,
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
    "&:hover": { transform: "scale(1.02)", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" },
  };

  const statBoxStyle = {
    p: 2,
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255,255,255,0.1)",
    textAlign: "center",
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Manager Dashboard</Typography>

      {/* Key Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}><Box sx={statBoxStyle}><Typography variant="h6">Total Projects</Typography><Typography variant="h5">{projects.length}</Typography></Box></Grid>
        <Grid item xs={12} md={4}><Box sx={statBoxStyle}><Typography variant="h6">Active Projects</Typography><Typography variant="h5">{projects.filter(p => p.status==="Active").length}</Typography></Box></Grid>
        <Grid item xs={12} md={4}><Box sx={statBoxStyle}><Typography variant="h6">Total Tickets</Typography><Typography variant="h5">{clientTickets.length+chatTickets.length}</Typography></Box></Grid>
      </Grid>

      {/* Projects */}
      <Typography variant="h5" sx={{ mb: 2 }}>Projects</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {projects.map(proj => (
          <Grid item xs={12} md={4} key={proj.id}>
            <Tooltip title={`Click for details\nDevelopers: ${proj.developers.join(", ")}\nDue: ${proj.dueDate}`} arrow>
              <Box sx={glassBoxStyle} onClick={() => navigate(`/manager/projects/${proj.id}`)}>
                <Chip label={proj.status} size="small" sx={{ mb: 1, bgcolor: getStatusColor(proj.status), color:"#fff" }}/>
                <Typography variant="h6">{proj.name}</Typography>
                <LinearProgress variant="determinate" value={proj.progress} sx={{ mt:1, mb:1, height:8, borderRadius:5, backgroundColor:"rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar":{backgroundColor:getStatusColor(proj.status)}}}/>
                <Typography variant="body2">{proj.progress}% complete</Typography>
              </Box>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {/* Tickets */}
      <Typography variant="h5" sx={{ mb: 2 }}>Tickets</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb:1 }}>Client Tickets</Typography>
          {clientTickets.map(ticket => (
            <Box key={ticket.id} sx={glassBoxStyle} onClick={() => handleOpenModal(ticket, "client")}>
              <Typography variant="body1">{ticket.title} — <i>{getProjectName(ticket.projectId)}</i></Typography>
            </Box>
          ))}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb:1 }}>Chat Tickets</Typography>
          {chatTickets.map(ticket => (
            <Box key={ticket.id} sx={glassBoxStyle} onClick={() => handleOpenModal(ticket, "chat")}>
              <Typography variant="body1">{ticket.title} — <i>{getProjectName(ticket.projectId)}</i></Typography>
            </Box>
          ))}
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
