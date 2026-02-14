"use client";

import { type ReactNode } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Dashboard layout for the web view -- full-width canvas with top bar.
 * This is the "judge POV" surface: spatial workspace with animated layout.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ px: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              flexGrow: 1,
            }}
          >
            Spatial Voice
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mr: 2 }}
          >
            Workspace Dashboard
          </Typography>
          <Chip
            label="Synced"
            size="small"
            color="success"
            variant="outlined"
            sx={{ mr: 2, fontSize: "0.75rem" }}
          />
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Canvas area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 3,
          backgroundColor: "background.default",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
