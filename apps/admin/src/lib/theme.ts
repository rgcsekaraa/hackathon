"use client";

import { createTheme, type PaletteMode } from "@mui/material/styles";

export function buildTheme(mode: PaletteMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#8AB4F8" : "#1A73E8",
        light: isDark ? "#AECBFA" : "#4285F4",
        dark: isDark ? "#669DF6" : "#1557B0",
      },
      secondary: {
        main: isDark ? "#669DF6" : "#1557B0",
      },
      background: {
        default: isDark ? "#0E0E0E" : "#F8F9FA",
        paper: isDark ? "#1A1A1A" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#E8EAED" : "#202124",
        secondary: isDark ? "#9AA0A6" : "#5F6368",
      },
      divider: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      error: {
        main: isDark ? "#F28B82" : "#D93025",
      },
      warning: {
        main: isDark ? "#FDD663" : "#E37400",
      },
      success: {
        main: isDark ? "#81C995" : "#1E8E3E",
      },
      info: {
        main: isDark ? "#8AB4F8" : "#1A73E8",
      },
    },
    typography: {
      fontFamily: '"Google Sans", "Roboto", "Arial", sans-serif',
      h5: {
        fontWeight: 500,
        letterSpacing: 0,
      },
      h6: {
        fontWeight: 500,
        fontSize: "1.1rem",
        letterSpacing: 0,
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: "0.95rem",
      },
      subtitle2: {
        fontWeight: 400,
      },
      body1: {
        fontSize: "0.875rem",
        lineHeight: 1.5,
      },
      body2: {
        fontSize: "0.8125rem",
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            padding: "8px 24px",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: 12,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            "&.Mui-selected": {
              backgroundColor: isDark
                ? "rgba(138, 180, 248, 0.08)"
                : "rgba(26, 115, 232, 0.08)",
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: isDark ? "#9AA0A6" : "#5F6368",
            "&.Mui-selected": {
              color: isDark ? "#8AB4F8" : "#1A73E8",
            },
            minWidth: 0,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: "0.75rem",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: isDark ? "#0E0E0E" : "#FFFFFF",
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isDark
              ? "0 4px 16px rgba(0,0,0,0.6)"
              : "0 4px 16px rgba(0,0,0,0.15)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}
