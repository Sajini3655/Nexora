import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LayoutProvider } from "./context/LayoutContext.jsx";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7c5cff" },
    secondary: { main: "#22c55e" },
    background: {
      default: "#0b1020",
      paper: "rgba(255,255,255,0.06)"
    },
    text: {
      primary: "#e7e9ee",
      secondary: "rgba(231,233,238,0.72)"
    },
    divider: "rgba(255,255,255,0.10)"
  },

  shape: { borderRadius: 16 },

  typography: {
    fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`,
    h5: { fontWeight: 900, letterSpacing: -0.4 },
    h6: { fontWeight: 900, letterSpacing: -0.2 },
    button: { textTransform: "none", fontWeight: 800 }
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(1000px 600px at 20% 10%, rgba(124,92,255,0.26), transparent 60%), radial-gradient(900px 700px at 80% 20%, rgba(34,197,94,0.16), transparent 55%)",
          backgroundAttachment: "fixed"
        }
      }
    },

    // Keep Paper clean globally (Menus/Popovers shouldn't inherit glass borders)
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
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
        root: { borderRadius: 14, paddingInline: 16, height: 44 }
      }
    },

    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        size: "small",
        variant: "outlined"
      }
    },

    // ✅ FIXED: single root override (was duplicated before)
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.04)",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.22)"
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(124,92,255,0.65)"
          }
        },
        notchedOutline: {
          borderColor: "rgba(255,255,255,0.12)"
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LayoutProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </LayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

