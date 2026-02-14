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
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              flexGrow: 1,
              color: "text.primary",
              letterSpacing: "-0.01em",
            }}
          >
            Spatial Voice
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
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0, borderRadius: 0, zIndex: 1000 }} 
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={navValue}
          onChange={(event, newValue) => setNavValue(newValue)}
          sx={{
            height: 80,
            borderTop: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            "& .MuiBottomNavigationAction-root": {
              color: "text.secondary",
              "&.Mui-selected": {
                color: "primary.main",
              },
            },
          }}
        >
          <BottomNavigationAction label="Inbox" icon={<InboxIcon />} />
          <BottomNavigationAction label="Projects" icon={<FolderIcon />} />
          <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
