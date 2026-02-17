// src/pages/dashboard/ManagerDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  fetchTickets,
  fetchProjects,
  fetchAISummaries,
} from "../../services/managerService";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FF8042"];

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const [ticketStats, setTicketStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const tickets = await fetchTickets();
      setTicketStats(tickets);

      const projs = await fetchProjects();
      setProjects(projs);

      const aiSumm = await fetchAISummaries();
      setSummaries(aiSumm);

      setLoading(false);
    }
    loadData();
  }, []);

  const goToProject = (id) => navigate(`/manager/projects/${id}`);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  const ticketPieData = [
    { name: "Open", value: ticketStats.open },
    { name: "Closed", value: ticketStats.closed },
    { name: "Other", value: ticketStats.total - ticketStats.open - ticketStats.closed },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Manager Dashboard
      </Typography>

      {/* Quick Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate("/manager/add-project")}
          >
            + Add Project
          </Button>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate("/manager/tickets")}
          >
            Open Ticket
          </Button>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate("/manager/ai-summaries")}
          >
            AI Summaries
          </Button>
        </Grid>
      </Grid>

      {/* Ticket Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Ticket Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ticketPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {ticketPieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Project Progress
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projects}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Projects */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Projects
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {projects.map((p) => (
            <Grid key={p.id} item xs={12} sm={4}>
            <Card sx={{ bgcolor: "#fef3c7" }}> {/* light yellow */}
                <CardContent>
                <Typography variant="h6" sx={{ color: "#111827", fontWeight: 600 }}>
                    {p.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: "#111827" }}>
                    Progress: {p.progress}%
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => goToProject(p.id)}
                >
                    View Project
                </Button>
                </CardContent>
            </Card>
            </Grid>
        ))}
        </Grid>

      {/* AI Summaries */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Last AI Chat Summaries
      </Typography>
      <Grid container spacing={2}>
        {summaries.map((s) => (
            <Grid key={s.id} item xs={12} sm={6}>
            <Card sx={{ bgcolor: "#dbeafe" }}> {/* light blue */}
                <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1e3a8a" }}>
                    {s.project}
                </Typography>
                <Typography variant="body2" sx={{ color: "#1e3a8a" }}>
                    {s.summary}
                </Typography>
                </CardContent>
            </Card>
            </Grid>
        ))}
</Grid>
    </Box>
  );
}
