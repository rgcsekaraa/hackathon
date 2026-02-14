"use client";

import { type ReactNode } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

import { ThemeToggle } from "@/components/ThemeToggle";

interface MobileLayoutProps {
  children: ReactNode;
}

/**
 * Mobile layout with compact header and bottom input area.
 * Designed for the "control + capture" surface -- voice, text, chips.
 */
export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        maxWidth: 480,
        mx: "auto",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: 56, px: 2 }}>
          <Typography
            variant="h6"
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
          <Chip
            label="Synced"
            size="small"
            color="success"
            variant="outlined"
            sx={{ mr: 1, fontSize: "0.7rem" }}
          />
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Content area -- scrollable */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: 2,
          py: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
