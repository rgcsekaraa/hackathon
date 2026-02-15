"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import useMediaQuery from "@mui/material/useMediaQuery";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useTheme } from "@mui/material/styles";

import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import TodayOutlined from "@mui/icons-material/TodayOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import QuestionAnswerOutlined from "@mui/icons-material/QuestionAnswerOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import WifiOffOutlined from "@mui/icons-material/WifiOffOutlined";

import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useThemeMode } from "@/lib/theme-context";
import AppointmentsView from "./appointments-view";
import CalendarView from "./calendar-view";
import EnquiriesView from "./enquiries-view";
import NotificationsPanel from "./notifications-panel";
import VoiceFab from "./voice-fab";
import EnquiryPushSystem from "./enquiry-push-modal";

type TabValue = "today" | "calendar" | "enquiries";

const TAB_CONFIG: { value: TabValue; label: string; icon: React.ReactElement }[] = [
  { value: "today", label: "Today", icon: <TodayOutlined /> },
  { value: "calendar", label: "Calendar", icon: <CalendarMonthOutlined /> },
  { value: "enquiries", label: "Enquiries", icon: <QuestionAnswerOutlined /> },
];

export default function DashboardShell({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const {
    activeCall,
    activeCaller,
    notifications,
    agentStage,
    connectionStatus,
    smsPhotoRequestEnabled,
    setSmsPhotoRequestEnabled,
  } = useWorkspace();
  const [tab, setTab] = useState<TabValue>("today");
  const [notifOpen, setNotifOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [savingSmsPref, setSavingSmsPref] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const defaultContent: Record<TabValue, React.ReactNode> = {
    today: <AppointmentsView />,
    calendar: <CalendarView />,
    enquiries: <EnquiriesView />,
  };

  const sideWidth = isDesktop ? 240 : 72;

  const mainContent = children || defaultContent[tab];

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      {/* Desktop / Tablet side rail */}
      {(isDesktop || isTablet) && (
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
          <Box sx={{ px: isDesktop ? 2 : 1, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: isDark ? "rgba(138,180,248,0.12)" : "rgba(26,115,232,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AutoAwesomeOutlined sx={{ color: "primary.main", fontSize: 20 }} />
            </Box>
            {isDesktop && (
              <Typography
                variant="h6"
                sx={{ color: "text.primary", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em" }}
              >
                Sophie Orbit
              </Typography>
            )}
          </Box>

          <Divider sx={{ borderColor: "divider" }} />

          {/* Nav items - Only show if using tab system */}
          {!children && (
            <List sx={{ px: 1, pt: 1, flex: 1 }}>
              {TAB_CONFIG.map((t) => (
                <ListItemButton
                  key={t.value}
                  selected={tab === t.value}
                  onClick={() => setTab(t.value)}
                  sx={{
                    mb: 0.5,
                    borderRadius: 2,
                    justifyContent: isDesktop ? "flex-start" : "center",
                    px: isDesktop ? 2 : 1,
                    minHeight: 44,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isDesktop ? 36 : 0,
                      color: tab === t.value ? "primary.main" : "text.secondary",
                      justifyContent: "center",
                    }}
                  >
                    {t.icon}
                  </ListItemIcon>
                  {isDesktop && (
                    <ListItemText
                      primary={t.label}
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: tab === t.value ? 500 : 400,
                        color: tab === t.value ? "text.primary" : "text.secondary",
                      }}
                    />
                  )}
                </ListItemButton>
              ))}
            </List>
          )}

          {/* Theme toggle at bottom of rail */}
          <Box sx={{ px: 1, pb: 2, mt: children ? 'auto' : 0 }}>
            <ListItemButton
              onClick={toggleMode}
              sx={{
                borderRadius: 2,
                justifyContent: isDesktop ? "flex-start" : "center",
                px: isDesktop ? 2 : 1,
                minHeight: 44,
              }}
            >
              <ListItemIcon
                sx={{ minWidth: isDesktop ? 36 : 0, color: "text.secondary", justifyContent: "center" }}
              >
                {isDark ? <LightModeOutlined /> : <DarkModeOutlined />}
              </ListItemIcon>
              {isDesktop && (
                <ListItemText
                  primary={isDark ? "Light mode" : "Dark mode"}
                  primaryTypographyProps={{ fontSize: "0.875rem", color: "text.secondary" }}
                />
              )}
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
          ml: isDesktop ? `${sideWidth}px` : isTablet ? `${sideWidth}px` : 0,
          width: isDesktop || isTablet ? `calc(100% - ${sideWidth}px)` : "100%",
        }}
      >
        {/* Top bar */}
        <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
            {/* Mobile logo */}
            {!isDesktop && !isTablet && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
                <AutoAwesomeOutlined sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography
                  variant="h6"
                  sx={{ color: "text.primary", fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.01em" }}
                >
                  Sophie
                </Typography>
              </Box>
            )}

            {/* Connection status */}
            {connectionStatus === "connected" ? (
              <Chip
                icon={<FiberManualRecord sx={{ fontSize: "8px !important", color: isDark ? "#81C995" : "#1E8E3E" }} />}
                label="Live"
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(129,201,149,0.08)" : "rgba(30,142,62,0.05)",
                  color: isDark ? "#81C995" : "#1E8E3E",
                  height: 24,
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  mr: 0.5,
                  "& .MuiChip-icon": { ml: 0.5 },
                  animation: "none",
                }}
              />
            ) : connectionStatus === "disconnected" || connectionStatus === "error" ? (
              <Chip
                icon={<WifiOffOutlined sx={{ fontSize: "14px !important" }} />}
                label="Offline"
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(242,139,130,0.08)" : "rgba(217,48,37,0.05)",
                  color: isDark ? "#F28B82" : "#D93025",
                  height: 24,
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  mr: 0.5,
                  "& .MuiChip-icon": { ml: 0.5, color: isDark ? "#F28B82" : "#D93025" },
                }}
              />
            ) : null}

            <Typography
              variant="h6"
              sx={{
                flex: 1,
                color: isDesktop || isTablet ? "text.primary" : "text.secondary",
                fontSize: { xs: "0.85rem", sm: "1rem" },
                fontWeight: isDesktop || isTablet ? 500 : 400,
              }}
            >
              {isDesktop || isTablet ? (children ? "Orbit" : TAB_CONFIG.find((t) => t.value === tab)?.label) : ""}
            </Typography>

            {/* Mobile theme toggle */}
            {!isDesktop && !isTablet && (
              <IconButton
                onClick={toggleMode}
                size="small"
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                sx={{ color: "text.secondary", mr: 0.5 }}
              >
                {isDark ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
              </IconButton>
            )}

            {/* Notification bell */}
            <IconButton
              onClick={() => setNotifOpen(true)}
              aria-label="Open notifications"
              sx={{ color: "text.secondary", mr: 0.5 }}
            >
              <Badge
                badgeContent={notifications.filter((n) => !n.read).length}
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: isDark ? "#8AB4F8" : "#1A73E8",
                    color: isDark ? "#0E0E0E" : "#FFFFFF",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                  },
                }}
              >
                <NotificationsOutlined />
              </Badge>
            </IconButton>

            {/* Avatar */}
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              aria-label="Open user menu"
              sx={{ p: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: isDark ? "rgba(138,180,248,0.15)" : "rgba(26,115,232,0.1)",
                  color: "primary.main",
                  fontSize: "0.75rem",
                  fontWeight: 600,
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
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ color: "text.primary", fontSize: "0.875rem" }}>
                  {user?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                  {user?.email}
                </Typography>
              </Box>
              <Divider sx={{ borderColor: "divider" }} />
              <MenuItem onClick={() => setAnchorEl(null)} sx={{ gap: 1.5, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 0, color: "text.secondary" }}>
                  <PersonOutline fontSize="small" />
                </ListItemIcon>
                <Typography variant="body1" sx={{ color: "text.primary" }}>
                  Profile
                </Typography>
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  if (savingSmsPref) return;
                  setSavingSmsPref(true);
                  await setSmsPhotoRequestEnabled(!smsPhotoRequestEnabled);
                  setSavingSmsPref(false);
                }}
                sx={{ gap: 1.5, py: 1, justifyContent: "space-between" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 0, color: "text.secondary" }}>
                    <NotificationsOutlined fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body1" sx={{ color: "text.primary" }}>
                    SMS Photo Request
                  </Typography>
                </Box>
                <Switch
                  edge="end"
                  checked={smsPhotoRequestEnabled}
                  disabled={savingSmsPref}
                  onChange={async (event) => {
                    event.stopPropagation();
                    if (savingSmsPref) return;
                    setSavingSmsPref(true);
                    await setSmsPhotoRequestEnabled(event.target.checked);
                    setSavingSmsPref(false);
                  }}
                />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  logout();
                }}
                sx={{ gap: 1.5, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: "text.secondary" }}>
                  <LogoutOutlined fontSize="small" />
                </ListItemIcon>
                <Typography variant="body1" sx={{ color: "text.primary" }}>
                  Sign out
                </Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Scrollable content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            pb: { xs: "80px", sm: isTablet || isDesktop ? 2 : "80px" },
          }}
        >
          {/* Active Call Banner */}
          {activeCall && (
            <Box
                sx={{
                    bgcolor: "error.main",
                    color: "white",
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    boxShadow: 2,
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                }}
            >
                <Box sx={{ 
                    width: 12, height: 12, borderRadius: "50%", bgcolor: "white",
                    animation: "pulse 1.5s infinite"
                }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Active Call: {activeCaller || "Unknown Caller"}
                </Typography>
                <Chip size="small" label={`Stage: ${agentStage}`} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }} />
                <style>
                    {`
                    @keyframes pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.2); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    `}
                </style>
            </Box>
          )}

          <Box sx={{ maxWidth: children ? '100%' : 720, mx: "auto", px: { xs: 0, sm: 1, md: 2 } }}>
            {mainContent}
          </Box>
        </Box>

        {/* Mobile bottom nav - Only if not children */}
        {!isDesktop && !isTablet && !children && (
          <BottomNavigation
            value={tab}
            onChange={(_, v) => setTab(v)}
            showLabels
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1200,
              height: 64,
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.7rem",
                mt: 0.25,
                "&.Mui-selected": { fontSize: "0.7rem" },
              },
            }}
          >
            {TAB_CONFIG.map((t) => (
              <BottomNavigationAction key={t.value} label={t.label} value={t.value} icon={t.icon} />
            ))}
          </BottomNavigation>
        )}
      </Box>

      {/* Voice FAB */}
      {!children && <VoiceFab />}

      {/* Notifications drawer */}
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* In-app push notification system */}
      {!children && <EnquiryPushSystem />}
    </Box>
  );
}
