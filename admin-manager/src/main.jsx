window.global = window;

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LayoutProvider } from "./context/LayoutContext.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#5b6cff" },
    secondary: { main: "#2fbf71" },
    background: {
      default: "#0b1120",
      paper: "rgba(255,255,255,0.05)"
    },
    text: {
      primary: "#e8ebf2",
      secondary: "rgba(232,235,242,0.70)"
    },
    divider: "rgba(255,255,255,0.08)"
  },

  shape: { borderRadius: 16 },

  typography: {
    fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`,
    fontSize: 15,
    h1: { fontWeight: 950, letterSpacing: -1.2, fontSize: "2.15rem", lineHeight: 1.08 },
    h2: { fontWeight: 950, letterSpacing: -1, fontSize: "1.8rem", lineHeight: 1.1 },
    h3: { fontWeight: 950, letterSpacing: -0.8, fontSize: "1.55rem", lineHeight: 1.12 },
    h4: { fontWeight: 950, letterSpacing: -0.6, fontSize: "1.3rem", lineHeight: 1.15 },
    h5: { fontWeight: 900, letterSpacing: -0.4, fontSize: "1.12rem", lineHeight: 1.2 },
    h6: { fontWeight: 900, letterSpacing: -0.25, fontSize: "1rem", lineHeight: 1.25 },
    subtitle1: { fontWeight: 700, fontSize: "0.98rem", lineHeight: 1.45 },
    subtitle2: { fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.45 },
    body1: { fontSize: "0.92rem", lineHeight: 1.55 },
    body2: { fontSize: "0.86rem", lineHeight: 1.5 },
    caption: { fontSize: "0.78rem", lineHeight: 1.45 },
    overline: { fontSize: "0.73rem", lineHeight: 1.4, letterSpacing: 1.1 },
    button: { textTransform: "none", fontWeight: 800, fontSize: "0.9rem" }
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontSize: 15,
        },
        body: {
          fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`,
          fontSize: 15,
          lineHeight: 1.5,
          backgroundImage:
            "radial-gradient(1000px 600px at 20% 10%, rgba(91,108,255,0.14), transparent 60%), radial-gradient(900px 700px at 80% 20%, rgba(47,191,113,0.08), transparent 55%)",
          backgroundAttachment: "fixed"
        },
        "*, *::before, *::after": {
          boxSizing: "border-box",
        },
        "button, input, textarea, select": {
          fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`,
        }
      }
    },

    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`,
        }
      }
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderColor: "rgba(148,163,184,0.14)"
        }
      }
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(14px)",
          background:
            "linear-gradient(180deg, rgba(15,18,35,0.92), rgba(15,18,35,0.55))",
          borderBottom: "1px solid rgba(255,255,255,0.10)"
        }
      }
    },

    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 16, height: 42, fontWeight: 800 },
        outlined: {
          borderColor: "rgba(148,163,184,0.20)",
        },
        contained: {
          boxShadow: "none",
        }
      }
    },

    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        size: "small",
        variant: "outlined"
      }
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.03)",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.18)"
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(91,108,255,0.55)"
          }
        },
        notchedOutline: {
          borderColor: "rgba(255,255,255,0.10)"
        }
      }
    },

    MuiContainer: {
      defaultProps: { maxWidth: "xl" }
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.04)"
        }
      }
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        },
        head: {
          fontWeight: 900,
          opacity: 0.85
        }
      }
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.04)"
          }
        }
      }
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "rgba(255,255,255,0.10)" }
      }
    }
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <LayoutProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <App />
            </ThemeProvider>
          </LayoutProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
