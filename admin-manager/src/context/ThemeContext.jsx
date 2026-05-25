import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const STORAGE_KEY = "nexora-color-scheme";

const ThemeContext = createContext({
  mode: "dark",
  toggleColorScheme: () => {},
  setMode: () => {},
});

function normalizeMode(value, fallback = "dark") {
  return value === "light" || value === "dark" ? value : fallback;
}

export function ThemeModeProvider({ children, defaultMode = "dark" }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return normalizeMode(defaultMode);

    try {
      return normalizeMode(window.localStorage.getItem(STORAGE_KEY), defaultMode);
    } catch {
      return normalizeMode(defaultMode);
    }
  });

  const muiTheme = useMemo(() => {
    const isDark = mode === "dark";

    const getCssVar = (name, fallback) => {
      if (typeof window === 'undefined' || !window.getComputedStyle) return fallback;
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    };

    return createTheme({
      palette: {
        mode,
        // read colors from CSS variables so MUI matches the token system
        primary: { main: getCssVar('--nx-blue', isDark ? '#8b7cff' : '#2563eb') },
        secondary: { main: getCssVar('--nx-green', isDark ? '#22c55e' : '#16a34a') },
        background: {
          default: getCssVar('--nx-bg', isDark ? '#020617' : '#eef8ff'),
          paper: getCssVar('--nx-card', isDark ? '#0b1220' : '#ffffff'),
        },
        text: {
          primary: getCssVar('--nx-text', isDark ? '#f8fafc' : '#0f172a'),
          secondary: getCssVar('--nx-text-soft', isDark ? '#cbd5e1' : '#1e293b'),
        },
        divider: getCssVar('--nx-border', isDark ? '#263449' : '#bed4f3'),
      },
      shape: { borderRadius: 16 },
      typography: {
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              background: "var(--nx-bg)",
              color: "var(--nx-text)",
              overflowX: "hidden",
            },
          },
        },
      },
    });
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore storage failures
    }

    const root = document.documentElement;
    root.setAttribute("data-theme", mode);

    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  const toggleColorScheme = (nextMode) => {
    const resolved = normalizeMode(nextMode, mode === "dark" ? "light" : "dark");
    setMode(resolved);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleColorScheme }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}

export default ThemeContext;