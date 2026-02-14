"use client";

import { type ReactNode } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import InboxIcon from "@mui/icons-material/InboxOutlined";
import FolderIcon from "@mui/icons-material/FolderOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import { useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";

interface MobileLayoutProps {
  children: ReactNode;
}

/**
 * Mobile layout with M3 Bottom Navigation and refined AppBar.
 */
export function MobileLayout({ children }: MobileLayoutProps) {
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
      }}
    >
      {/* M3 Top App Bar */}
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: "2.5px solid", // Bolder border
          borderColor: "primary.main", // High contrast border
          backgroundColor: theme => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
        }}
      >
        <Toolbar sx={{ minHeight: 72, px: 3 }}> {/* Taller AppBar */}
          <Typography
            variant="h5" // Larger title
            sx={{
              fontWeight: 900, // Extra bold
              flexGrow: 1,
              color: "text.primary",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            Sophiie
          </Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Scrollable Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: 2,
          py: 2,
          pb: 10, // Space for BottomNav
        }}
      >
        {children}
      </Box>

      {/* M3 Bottom Navigation */}
      <Paper 
        sx={{ 
          position: "fixed", 
          bottom: 0, 
          left: 0, 
          right: 0, 
          borderRadius: 0, 
          zIndex: 1000,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.15)" // Stronger shadow
        }} 
        elevation={0}
      >
        <BottomNavigation
          showLabels
          value={navValue}
          onChange={(event, newValue) => setNavValue(newValue)}
          sx={{
            height: 90, // Taller for better tap targets
            borderTop: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            "& .MuiBottomNavigationAction-root": {
              color: "text.secondary",
              minWidth: 0,
              padding: "12px 0",
              "&.Mui-selected": {
                color: "primary.main",
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.85rem",
                  fontWeight: 900, // Extra bold labels
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "1.8rem", // Larger icons
                }
              },
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.75rem",
                fontWeight: 700,
              },
              "& .MuiSvgIcon-root": {
                fontSize: "1.6rem",
              }
            },
          }}
        >
          <BottomNavigationAction label="INBOX" icon={<InboxIcon />} />
          <BottomNavigationAction label="PROJECTS" icon={<FolderIcon />} />
          <BottomNavigationAction label="SETTINGS" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
