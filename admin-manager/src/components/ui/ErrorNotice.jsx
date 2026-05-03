import React, { useState } from "react";
import { Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Simple module-level set to track shown messages and avoid duplicates across widgets
const shownMessages = new Set();

export default function ErrorNotice({ message, severity = "warning", sx, dedupeKey }) {
  const [visible, setVisible] = useState(Boolean(message));
  if (!message || !visible) return null;

  const key = dedupeKey || String(message);
  if (shownMessages.has(key)) return null;

  // mark as shown so other components won't duplicate
  shownMessages.add(key);

  const handleClose = () => {
    setVisible(false);
    // keep message marked as shown so other components won't re-show it during this session
  };

  return (
    <Alert
      severity={severity}
      sx={sx}
      action={
        <IconButton aria-label="close" size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      }
    >
      {message}
    </Alert>
  );
}
