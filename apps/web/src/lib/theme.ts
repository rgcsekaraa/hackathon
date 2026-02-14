"use client";

import { createTheme, type ThemeOptions } from "@mui/material/styles";

/**
 * Production-grade theme tokens inspired by Sophiie.ai
 * "Premium Enterprise" aesthetic -- deep navy, clean slate, sharp typography.
 */
const M3_TOKENS = {
  borderRadius: {
    xs: 6,
    s: 10,
    m: 16, // Smoother M3 Card radius
    l: 24,
    xl: 32, // Pill shapes
  },
};

const sharedOptions: ThemeOptions = {
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.04em", fontSize: "2.75rem" },
    h2: { fontWeight: 800, letterSpacing: "-0.03em", fontSize: "2.25rem" },
    h3: { fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.75rem" },
    h4: { fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.5rem" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.25rem" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em", fontSize: "1.1rem" },
    subtitle1: { fontWeight: 600, letterSpacing: "0.01em", fontSize: "0.95rem" },
    subtitle2: { fontWeight: 600, letterSpacing: "0.01em", fontSize: "0.875rem" },
    body1: { fontSize: "1rem", lineHeight: 1.6, letterSpacing: "0.01em" },
    body2: { fontSize: "0.875rem", lineHeight: 1.6, letterSpacing: "0.01em" },
    button: { fontWeight: 700, textTransform: "none", fontSize: "0.875rem", letterSpacing: "0.03em" },
    caption: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" },
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
          backgroundColor: "#020617",
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
      main: "#6366f1", // Indigo
      light: "#818cf8",
      dark: "#4f46e5",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#fbbf24", // Amber/Gold accents for premium feel
      light: "#fcd34d",
      dark: "#d97706",
    },
    background: {
      default: "#020617", // Deep Navy/Slate
      paper: "#0f172a",
    },
    surfaceVariant: {
      main: "#1e293b",
      contrastText: "#cbd5e1",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
      disabled: "#475569",
    },
    divider: "rgba(255, 255, 255, 0.06)",
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

