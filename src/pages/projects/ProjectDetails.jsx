import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Typography, Card, CardContent } from "@mui/material";
import { fetchProjectDetails } from "../../services/managerService";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await fetchProjectDetails(projectId);
        setProject(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadProject();
  }, [projectId]);

  if (!project) return <Typography>Loading project...</Typography>;

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {project.name}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {project.description}
      </Typography>

      <Typography variant="h6">Tasks:</Typography>
      {project.tasks?.map((task) => (
        <Card key={task.id} sx={{ mb: 1 }}>
          <CardContent>
            <Typography>{task.name}</Typography>
            <Typography variant="body2">Status: {task.status}</Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
