import React, { useState } from "react";
import { Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const shownMessages = new Set();

export default function ErrorNotice({ message, severity = "warning", sx, dedupeKey }) {
  const [visible, setVisible] = useState(Boolean(message));
  if (!message || !visible) return null;

  const key = dedupeKey || String(message);
  if (shownMessages.has(key)) return null;

  shownMessages.add(key);

  const handleClose = () => {
    setVisible(false);
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

