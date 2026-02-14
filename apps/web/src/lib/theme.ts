"use client";

import { createTheme, type ThemeOptions } from "@mui/material/styles";

/**
 * Production-grade theme tokens inspired by Sophiie.ai
 * "Premium Enterprise" aesthetic -- deep navy, clean slate, sharp typography.
 */
const sharedOptions: ThemeOptions = {
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.025em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.015em" },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, letterSpacing: "0.01em" },
    body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", lineHeight: 1.57 },
    button: { fontWeight: 600, textTransform: "none", fontSize: "0.875rem" },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: "7px 16px",
          transition: "none", // Instant feel
          textTransform: "none",
          fontWeight: 600,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
            transform: "none",
          },
        },
      },
      defaultProps: {
        disableElevation: true,
        disableRipple: true, // Extreme instant feel
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: "none",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          transition: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: "#0f172a",
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "none",
        },
      },
    },
  },
};

/**
 * Sophiie Light Theme -- Professional white/slate palette.
 */
export const lightTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "light",
    primary: {
      main: "#1d4ed8", // Professional Blue
      light: "#3b82f6",
      dark: "#1e40af",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0f172a", // Deep Navy
      light: "#334155",
      dark: "#020617",
    },
    accent: {
      main: "#00d1ff", // Sophiie Teal
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
      disabled: "#94a3b8",
    },
    divider: "rgba(0, 0, 0, 0.06)",
    success: { main: "#10b981" },
    error: { main: "#ef4444" },
    warning: { main: "#f59e0b" },
    info: { main: "#0ea5e9" },
  },
});

/**
 * Sophiie Dark Theme -- Refined navy/slate.
 */
export const darkTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#94a3b8",
      light: "#cbd5e1",
      dark: "#64748b",
    },
    background: {
      default: "#020617", // Deeper Navy
      paper: "#0f172a",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
      disabled: "#64748b",
    },
    divider: "rgba(255, 255, 255, 0.06)",
  },
});

// Add custom palette types for TS
declare module "@mui/material/styles" {
  interface Palette {
    accent: Palette["primary"];
  }
  interface PaletteOptions {
    accent?: PaletteOptions["primary"];
  }
}

