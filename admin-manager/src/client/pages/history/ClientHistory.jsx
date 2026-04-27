import React, { useEffect, useState } from "react";
import ClientLayout from "../../components/layout/ClientLayout";
import {
  fetchClientHistory,
  fetchClientProfile
} from "../../services/clientService";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Avatar,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ProjectsIcon from "@mui/icons-material/Folder";
import TicketsIcon from "@mui/icons-material/Assignment";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `tab-${index}`,
    "aria-controls": `tabpanel-${index}`,
  };
}

export default function ClientHistory() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [profileData, historyData] = await Promise.all([
        fetchClientProfile(),
        fetchClientHistory()
      ]);
      setProfile(profileData);
      setHistory(historyData);
    } catch (err) {
      setError(err?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <ClientLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "rgba(124,92,255,0.8)" }} />
        </Box>
      </ClientLayout>
    );
  }

  const finishedProjects = history?.projects || [];
  const completedTickets = history?.tickets || [];

  return (
    <ClientLayout>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 32, color: "rgba(124,92,255,0.8)" }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
                Your History
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)", mt: 0.5 }}>
                View all completed projects and resolved tickets
              </Typography>
            </Box>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, rgba(124,92,255,0.15), rgba(124,92,255,0.05))",
                border: "1px solid rgba(124,92,255,0.2)",
                backdropFilter: "blur(10px)",
                p: 2
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    background: "rgba(124,92,255,0.2)",
                    border: "2px solid rgba(124,92,255,0.3)"
                  }}
                >
                  <ProjectsIcon sx={{ color: "rgba(124,92,255,0.8)" }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                    Completed Projects
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {finishedProjects.length}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, rgba(0,255,170,0.15), rgba(0,255,170,0.05))",
                border: "1px solid rgba(0,255,170,0.2)",
                backdropFilter: "blur(10px)",
                p: 2
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    background: "rgba(0,255,170,0.2)",
                    border: "2px solid rgba(0,255,170,0.3)"
                  }}
                >
                  <TicketsIcon sx={{ color: "rgba(0,255,170,0.8)" }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                    Resolved Tickets
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {completedTickets.length}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for Projects and Tickets */}
        <Paper
          sx={{
            background: "rgba(15,20,40,0.6)",
            border: "1px solid rgba(124,92,255,0.15)",
            backdropFilter: "blur(10px)"
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                "&.Mui-selected": {
                  color: "rgba(124,92,255,0.9)"
                }
              },
              "& .MuiTabs-indicator": {
                background: "linear-gradient(90deg, rgba(124,92,255,0.8), rgba(0,255,170,0.6))"
              }
            }}
          >
            <Tab label={`Completed Projects (${finishedProjects.length})`} {...a11yProps(0)} />
            <Tab label={`Resolved Tickets (${completedTickets.length})`} {...a11yProps(1)} />
          </Tabs>

          {/* Projects Tab */}
          <TabPanel value={tabValue} index={0}>
            {finishedProjects.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
                  No completed projects yet
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                {finishedProjects.map((project) => (
                  <Card
                    key={project.id}
                    sx={{
                      mb: 2,
                      background: "rgba(15,20,40,0.3)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      "&:hover": {
                        background: "rgba(15,20,40,0.5)",
                        borderColor: "rgba(124,92,255,0.2)"
                      },
                      transition: "all 0.3s ease"
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                        <Box flex={1}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                              {project.name}
                            </Typography>
                            <Chip
                              label="Completed"
                              size="small"
                              icon={<CheckCircleIcon />}
                              sx={{
                                background: "rgba(0,255,170,0.2)",
                                border: "1px solid rgba(0,255,170,0.3)",
                                color: "rgba(0,255,170,0.8)",
                                fontWeight: 700
                              }}
                            />
                          </Stack>
                          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 1.5 }}>
                            {project.description}
                          </Typography>
                          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                                STARTED
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.3 }}>
                                {new Date(project.startDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                                COMPLETED
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.3 }}>
                                {new Date(project.completedDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Tickets Tab */}
          <TabPanel value={tabValue} index={1}>
            {completedTickets.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
                  No resolved tickets yet
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                          Ticket ID
                        </TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                          Subject
                        </TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                          Category
                        </TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                          Resolved Date
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {completedTickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          sx={{
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            "&:hover": { background: "rgba(124,92,255,0.05)" }
                          }}
                        >
                          <TableCell sx={{ color: "#e7e9ee" }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                              #{ticket.id}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: "#e7e9ee" }}>
                            {ticket.subject}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ticket.category}
                              size="small"
                              sx={{
                                background: "rgba(124,92,255,0.15)",
                                border: "1px solid rgba(124,92,255,0.25)",
                                color: "rgba(124,92,255,0.8)",
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                            {new Date(ticket.resolvedDate).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Box>
    </ClientLayout>
  );
}
