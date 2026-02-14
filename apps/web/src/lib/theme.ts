"use client";

import { createTheme, type ThemeOptions } from "@mui/material/styles";

/**
 * Shared theme tokens used by both light and dark themes.
 * "Quiet premium ops" aesthetic -- clean typography, smooth transitions.
 */
const sharedOptions: ThemeOptions = {
  typography: {
    fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    subtitle1: { fontWeight: 500, letterSpacing: "0.01em" },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "8px 20px",
          transition: "all 0.2s ease-in-out",
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.15s ease-in-out",
        },
      },
    },
  },
};

/**
 * Light theme -- clean whites with subtle depth.
 */
export const lightTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "light",
    primary: {
      main: "#4f46e5",
      light: "#818cf8",
      dark: "#3730a3",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0ea5e9",
      light: "#38bdf8",
      dark: "#0369a1",
    },
    error: {
      main: "#ef4444",
    },
    warning: {
      main: "#f59e0b",
    },
    success: {
      main: "#10b981",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
    divider: "rgba(0, 0, 0, 0.08)",
  },
});

/**
 * Dark theme -- deep slate with vibrant accents.
 * This is the default for the "ops dashboard" feel.
 */
export const darkTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "dark",
    primary: {
      main: "#818cf8",
      light: "#a5b4fc",
      dark: "#6366f1",
      contrastText: "#0f172a",
    },
    secondary: {
      main: "#38bdf8",
      light: "#7dd3fc",
      dark: "#0ea5e9",
    },
    error: {
      main: "#f87171",
    },
    warning: {
      main: "#fbbf24",
    },
    success: {
      main: "#34d399",
    },
    background: {
      default: "#0c1222",
      paper: "#131b2e",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
});
