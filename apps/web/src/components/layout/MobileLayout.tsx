"use client";

import { type ReactNode } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import InboxIcon from "@mui/icons-material/InboxOutlined";
import FolderIcon from "@mui/icons-material/FolderOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import { useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";

interface MobileLayoutProps {
  children: ReactNode;
}

/**
 * Mobile layout with M3 Bottom Navigation and refined AppBar.
 */
export function MobileLayout({ children }: MobileLayoutProps) {
  const theme = useTheme();
  const [navValue, setNavValue] = useState(0);

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
        backgroundColor: "background.default",
        position: "relative",
      }}
    >
      {/* Immersive Glassmorphism Header */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backdropFilter: "blur(12px)",
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: 72, px: 2.5, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "10px",
                backgroundColor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
              }}
            >
              <Typography variant="h6" sx={{ color: "white", fontSize: "1rem" }}>O</Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                fontSize: "1rem",
              }}
            >
              Orbit
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ThemeToggle />
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: "surfaceVariant.main", 
                color: "text.primary",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: "1px solid",
                borderColor: "divider"
              }}
            >
              RG
            </Avatar>
          </Box>
        </Toolbar>
      </Box>

      {/* Scrollable Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          pt: "72px", // Height of header
          pb: "110px", // Space for floating hub
          px: 2,
        }}
      >
        {children}
      </Box>

      {/* Floating Orbit Hub - Gesture Friendly */}
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1200,
          width: "calc(100% - 48px)",
          maxWidth: 400,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: "32px",
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(20px)",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}
        >
          <BottomNavigation
            showLabels
            value={navValue}
            onChange={(event, newValue) => setNavValue(newValue)}
            sx={{
              height: 72,
              backgroundColor: "transparent",
              "& .MuiBottomNavigationAction-root": {
                color: "text.secondary",
                minWidth: 0,
                "&.Mui-selected": {
                  color: "primary.main",
                  "& .MuiBottomNavigationAction-label": {
                    fontWeight: 800,
                    fontSize: "0.7rem",
                    transform: "scale(1.1)",
                  },
                },
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  marginTop: "4px",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "1.5rem",
                },
              },
            }}
          >
            <BottomNavigationAction label="INBOX" icon={<InboxIcon />} />
            <BottomNavigationAction label="PROJECTS" icon={<FolderIcon />} />
            <BottomNavigationAction label="SETTINGS" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </Box>
  );
}
