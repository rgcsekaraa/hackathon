"use client";

import { createTheme, type ThemeOptions } from "@mui/material/styles";

/**
 * Production-grade theme tokens inspired by Sophiie.ai
 * "Premium Enterprise" aesthetic -- deep navy, clean slate, sharp typography.
 */
const M3_TOKENS = {
  borderRadius: {
    xs: 4,
    s: 8,
    m: 12, // Standard M3 Card/Component radius
    l: 16,
    xl: 28, // Extra rounded for FABs/Pills
  },
};

const sharedOptions: ThemeOptions = {
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontWeight: 700, letterSpacing: "-0.04em", fontSize: "2.5rem" },
    h2: { fontWeight: 700, letterSpacing: "-0.03em", fontSize: "2rem" },
    h3: { fontWeight: 600, letterSpacing: "-0.02em", fontSize: "1.5rem" },
    h4: { fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 500, letterSpacing: "0.01em", fontSize: "0.875rem" },
    body1: { fontSize: "0.875rem", lineHeight: 1.5, letterSpacing: "0.01em" },
    body2: { fontSize: "0.8125rem", lineHeight: 1.5, letterSpacing: "0.01em" },
    button: { fontWeight: 600, textTransform: "none", fontSize: "0.875rem", letterSpacing: "0.02em" },
    caption: { fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.04em" },
  },
  shape: {
    borderRadius: M3_TOKENS.borderRadius.m,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 100, // M3 Full-pill buttons
          padding: "8px 24px",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "none",
          fontWeight: 600,
          "&:hover": {
            boxShadow: "none",
            backgroundColor: "rgba(0,0,0,0.04)",
          },
        },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0 1px 3px rgba(0,0,0,0.12)" },
        },
        outlined: {
          border: "1px solid",
          borderColor: "divider",
          "&:hover": {
            border: "1px solid",
            backgroundColor: "rgba(0,0,0,0.02)",
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: M3_TOKENS.borderRadius.m,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          backgroundImage: "none",
          transition: "transform 0.2s ease, border-color 0.2s ease",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: M3_TOKENS.borderRadius.m,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          color: "inherit",
          boxShadow: "none",
          borderBottom: "1px solid",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: M3_TOKENS.borderRadius.s,
          },
        },
      },
    },
  },
};

/**
 * Sophiie Light Theme -- M3 Inspired Light Palette
 */
export const lightTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "light",
    primary: {
      main: "#1d4ed8",
      light: "#3b82f6",
      dark: "#1e40af",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#64748b",
      light: "#94a3b8",
      dark: "#475569",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    surfaceVariant: {
      main: "#e2e8f0",
      contrastText: "#475569",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
      disabled: "#94a3b8",
    },
    divider: "rgba(0, 0, 0, 0.08)",
  },
});

/**
 * Sophiie Dark Theme -- M3 Inspired Dark Palette
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
      default: "#020617",
      paper: "#0f172a",
    },
    surfaceVariant: {
      main: "#1e293b",
      contrastText: "#94a3b8",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
      disabled: "#64748b",
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
});

// Custom palette extensions
declare module "@mui/material/styles" {
  interface Palette {
    surfaceVariant: Palette["primary"];
  }
  interface PaletteOptions {
    surfaceVariant?: PaletteOptions["primary"];
  }
}

