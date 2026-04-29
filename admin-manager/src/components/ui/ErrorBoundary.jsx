import React from "react";
import { Box, Button, Typography, Paper } from "@mui/material";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    if (typeof this.props.onError === "function") {
      try {
        this.props.onError(error, info);
      } catch (_) {}
    }
    // still log to console for diagnostics
    // eslint-disable-next-line no-console
    console.error("Captured error in ErrorBoundary:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
    if (typeof this.props.onReset === "function") this.props.onReset();
  };

  render() {
    if (!this.state.hasError) return this.props.children || null;

    return (
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 2, background: "rgba(255,230,230,0.04)" }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.8)", mb: 2 }}>
            An unexpected error occurred while rendering this view.
          </Typography>
          <Button variant="contained" onClick={this.handleReset} sx={{ mr: 1 }}>Try again</Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>Reload</Button>
        </Paper>
      </Box>
    );
  }
}
