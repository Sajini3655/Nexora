import React from "react";
import { Typography } from "@mui/material";
import Card from "../../components/ui/Card.jsx";

export default function ChatPage() {
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Chat
      </Typography>
      <Card>
        <Typography sx={{ opacity: 0.8 }}>
          Chat feature UI goes here (later you can connect MongoDB/AI logs).
        </Typography>
      </Card>
    </>
  );
}
