import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchProjects } from "../../services/managerService";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects();
        setProjects(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadProjects();
  }, []);

  const goToProject = (id) => navigate(`/manager/projects/${id}`);

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        All Projects
      </Typography>
      <Grid container spacing={2}>
        {projects.map((p) => (
          <Grid key={p.id} item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">{p.name}</Typography>
                <Typography variant="body2">Progress: {p.progress}%</Typography>
                <Button variant="contained" onClick={() => goToProject(p.id)}>
                  View
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
