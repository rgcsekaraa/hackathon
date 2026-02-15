"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import useMediaQuery from "@mui/material/useMediaQuery";
import Drawer from "@mui/material/Drawer";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useTheme } from "@mui/material/styles";

import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import SettingsInputComponentOutlined from "@mui/icons-material/SettingsInputComponentOutlined";
import MonitorHeartOutlined from "@mui/icons-material/MonitorHeartOutlined";

import { useAuth } from "@/lib/auth-context";
import { useThemeMode } from "@/lib/theme-context";

/**
 * SpaceShell: Dedicated, minimalist layout for Super-Admin.
 * Stripped of all Orbit-specific features (Voice, Notifications, Push).
 */
export default function SpaceShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "SA";

  const sideWidth = isDesktop ? 240 : 72;

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      {/* Desktop / Tablet side rail */}
      {(isDesktop) && (
        <Drawer
          variant="permanent"
          PaperProps={{
            sx: {
              width: sideWidth,
              bgcolor: "background.paper",
              borderRight: 1,
              borderColor: "divider",
            },
          }}
        >
          {/* Logo area */}
          <Box sx={{ px: 2, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: isDark ? "rgba(138,180,248,0.1)" : "rgba(26,115,232,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AutoAwesomeOutlined sx={{ color: "primary.main", fontSize: 18 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{ color: "text.primary", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              SPACE
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "divider", opacity: 0.5 }} />

          {/* Admin Nav */}
          <Box sx={{ px: 1, pt: 2, flex: 1 }}>
             <ListItemButton
                selected
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  px: 2,
                  minHeight: 40,
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: "primary.main" }}>
                  <MonitorHeartOutlined sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Infrastructure"
                  primaryTypographyProps={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                />
              </ListItemButton>
              
              <ListItemButton
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  px: 2,
                  minHeight: 40,
                  opacity: 0.5
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: "text.secondary" }}>
                  <SettingsInputComponentOutlined sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Clusters"
                  primaryTypographyProps={{
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                />
              </ListItemButton>
          </Box>

          {/* Theme toggle */}
          <Box sx={{ px: 1, pb: 2 }}>
            <ListItemButton
              onClick={toggleMode}
              sx={{
                borderRadius: 2,
                px: 2,
                minHeight: 44,
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: "text.secondary" }}>
                {isDark ? <LightModeOutlined sx={{ fontSize: 20 }} /> : <DarkModeOutlined sx={{ fontSize: 20 }} />}
              </ListItemIcon>
              <ListItemText
                primary={isDark ? "System Light" : "System Dark"}
                primaryTypographyProps={{ fontSize: "0.75rem", fontWeight: 500, color: "text.secondary" }}
              />
            </ListItemButton>
          </Box>
        </Drawer>
      )}

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          ml: isDesktop ? `${sideWidth}px` : 0,
          width: isDesktop ? `calc(100% - ${sideWidth}px)` : "100%",
        }}
      >
        {/* Top bar */}
        <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.default" }}>
          <Toolbar sx={{ minHeight: 64, px: 3 }}>
            <Typography variant="h6" sx={{ flex: 1, color: "text.primary", fontSize: "0.9rem", fontWeight: 600 }}>
               CONTROL PLANE
            </Typography>

            {/* User Avatar */}
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ p: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  color: "text.primary",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  border: "1px solid",
                  borderColor: "divider"
                }}
              >
                {initials}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: "background.paper",
                    backgroundImage: "none",
                    border: 1,
                    borderColor: "divider",
                    minWidth: 200,
                    mt: 1,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" sx={{ color: "text.primary", fontSize: "0.8rem", fontWeight: 600 }}>
                  {user?.name || "Super Admin"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                  {user?.email}
                </Typography>
              </Box>
              <Divider sx={{ borderColor: "divider" }} />
              <MenuItem onClick={() => setAnchorEl(null)} sx={{ gap: 1.5, py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 0, color: "text.secondary" }}>
                  <PersonOutline fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Global Settings</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  logout();
                }}
                sx={{ gap: 1.5, py: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: "text.secondary" }}>
                  <LogoutOutlined fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Security Logout</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Scrollable content */}
        <Box component="main" sx={{ flex: 1, overflow: "auto", p: 4 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
