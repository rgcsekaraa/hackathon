"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import NotificationsNone from "@mui/icons-material/NotificationsNone";
import EventNote from "@mui/icons-material/EventNote";
import ChatBubbleOutline from "@mui/icons-material/ChatBubbleOutline";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import MoreVert from "@mui/icons-material/MoreVert";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Logout from "@mui/icons-material/Logout";

import { useAuth } from "@/components/providers/AuthProvider";
import AppointmentsView from "./AppointmentsView";
import EnquiriesView from "./EnquiriesView";
import CalendarView from "./CalendarView";
import NotificationsPanel from "./NotificationsPanel";
import VoiceFab from "./VoiceFab";
import EnquiryPushSystem from "./EnquiryPushSystem";

type ActiveView = "appointments" | "enquiries" | "calendar";

export default function DashboardShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>("appointments");
  const [notifOpen, setNotifOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    signOut();
  };

  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
        position: "relative",
      }}
    >
      {/* Top Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          backgroundImage: "none",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography sx={{ color: "white", fontWeight: 700, fontSize: "1.1rem" }}>O</Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: "text.primary",
                fontWeight: 700,
                letterSpacing: -0.5,
                fontSize: "1.25rem",
              }}
            >
              Orbit
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="large"
              onClick={() => setNotifOpen(true)}
              sx={{ color: "text.secondary" }}
            >
              <Badge variant="dot" color="primary">
                <NotificationsNone />
              </Badge>
            </IconButton>
            <IconButton
              size="large"
              onClick={handleMenu}
              sx={{ ml: 1, p: 0.5, border: 1, borderColor: "divider" }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "primary.main",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                {user?.full_name?.charAt(0) || "U"}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                 sx: { mt: 1, minWidth: 150, borderRadius: 2, border: 1, borderColor: 'divider' }
              }}
            >
              <MenuItem onClick={handleClose}>
                <AccountCircle sx={{ mr: 1.5, fontSize: 20, opacity: 0.7 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                <Logout sx={{ mr: 1.5, fontSize: 20 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 900,
          width: "100%",
          mx: "auto",
          pb: isMobile ? 12 : 4,
          px: { xs: 0, sm: 2 },
        }}
      >
        {activeView === "appointments" && <AppointmentsView />}
        {activeView === "enquiries" && <EnquiriesView />}
        {activeView === "calendar" && <CalendarView />}
      </Box>

      {/* Navigation - Bottom on Mobile, could be Sidebar on Desktop but keeping reference UI's approach */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <BottomNavigation
          showLabels
          value={activeView}
          onChange={(_, newValue) => setActiveView(newValue)}
          sx={{
            width: "100%",
            maxWidth: 600,
            height: 64,
            bgcolor: "transparent",
            "& .MuiBottomNavigationAction-root": {
              color: "text.secondary",
              "&.Mui-selected": {
                color: "primary.main",
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Home"
            value="appointments"
            icon={<EventNote />}
          />
          <BottomNavigationAction
            label="Enquiries"
            value="enquiries"
            icon={<ChatBubbleOutline />}
          />
          <BottomNavigationAction
            label="Calendar"
            value="calendar"
            icon={<CalendarMonth />}
          />
        </BottomNavigation>
      </Box>

      {/* Notifications Drawer */}
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Voice Interface */}
      <VoiceFab />

      {/* Real-time Enquiries */}
      <EnquiryPushSystem />
    </Box>
  );
}
