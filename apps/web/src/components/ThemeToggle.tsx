"use client";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import { useThemeMode } from "@/components/providers/ThemeProvider";

/**
 * Toggle button for switching between dark and light themes.
 * Shows the opposite mode icon as a hint of what clicking does.
 */
export function ThemeToggle() {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={toggleTheme}
        size="small"
        sx={{
          color: "text.secondary",
          "&:hover": {
            color: "text.primary",
            backgroundColor: "action.hover",
          },
        }}
      >
        {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
