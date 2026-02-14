"use client";

import { type ReactNode, useState } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import HomeIcon from "@mui/icons-material/GridViewOutlined";
import InboxIcon from "@mui/icons-material/InboxOutlined";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import DescriptionIcon from "@mui/icons-material/DescriptionOutlined";
import BuildIcon from "@mui/icons-material/BuildOutlined";
import ScheduleIcon from "@mui/icons-material/CalendarTodayOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import NotificationsIcon from "@mui/icons-material/NotificationsNoneOutlined";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import InputBase from "@mui/material/InputBase";
import { alpha, useTheme } from "@mui/material/styles";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { AIChatSidebar } from "@/components/AIChatSidebar";
import ChatIcon from "@mui/icons-material/ChatBubbleOutline";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import CircularProgress from "@mui/material/CircularProgress";
import Popover from "@mui/material/Popover";

const SIDEBAR_WIDTH = 240;
const NAVBAR_HEIGHT = 56;
const FOOTER_HEIGHT = 28;

interface DashboardLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { text: "Dashboard", icon: <HomeIcon fontSize="small" />, active: true },
  { text: "Inbox", icon: <InboxIcon fontSize="small" />, badge: 3 },
  { text: "Schedule", icon: <ScheduleIcon fontSize="small" /> },
  { text: "Jobs", icon: <BuildIcon fontSize="small" /> },
  { text: "Customers", icon: <PeopleIcon fontSize="small" /> },
  { text: "Documents", icon: <DescriptionIcon fontSize="small" /> },
];

/**
 * Dashboard layout for the web view -- full-width canvas with persistent sidebar.
 * Premium enterprise aesthetic inspired by Sophiie.ai.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const { user, logout, token } = useAuth();
  const isLight = theme.palette.mode === "light";
  
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results);
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "background.default",
      }}
    >
      {/* Sidebar - Enhanced MUI Drawer Style */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          height: "100vh",
          backgroundColor: isLight ? "#ffffff" : "background.paper",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        {/* Sidebar Header */}
        <Box sx={{ height: NAVBAR_HEIGHT, display: "flex", alignItems: "center", px: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "4px",
              backgroundColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.9rem",
              color: "white",
              mr: 1.5,
            }}
          >
            S
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.01em" }}>
            sophiie-space
          </Typography>
        </Box>

        {/* Sidebar Nav */}
        <Box sx={{ flex: 1, px: 1, py: 1.5 }}>
          <List sx={{ gap: 0.25, display: "flex", flexDirection: "column" }}>
            {NAV_ITEMS.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={item.active}
                  sx={{
                    borderRadius: "4px",
                    py: 1,
                    px: 1.5,
                    backgroundColor: item.active ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                    color: item.active ? "primary.main" : "text.secondary",
                    "&.Mui-selected": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: "primary.main",
                      "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.12) },
                    },
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.action.hover, 0.8),
                      color: "text.primary",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: item.active ? 600 : 500,
                    }}
                  />
                  {item.badge && (
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "primary.main", backgroundColor: alpha(theme.palette.primary.main, 0.1), px: 0.8, py: 0.1, borderRadius: "4px" }}>
                      {item.badge}
                    </Typography>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 3, px: 2, mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Project Folders
            </Typography>
          </Box>
          <List sx={{ px: 1, gap: 0.25, display: "flex", flexDirection: "column" }}>
            {["Work", "Personal", "Hackathon"].map((project) => (
              <ListItem key={project} disablePadding>
                <ListItemButton sx={{ borderRadius: "4px", py: 0.8, px: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: project === "Work" ? "primary.main" : "text.disabled" }} />
                  </ListItemIcon>
                  <ListItemText primary={project} primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Sidebar Footer - User Profile */}
        <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
          <ListItemButton sx={{ borderRadius: "4px", py: 1 }} onClick={logout}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "secondary.main" }}>
                {user?.full_name?.[0] || user?.email?.[0] || "U"}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={user?.full_name || "User"}
              secondary={user?.email || "Account"}
              primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: "0.7rem", sx: { overflow: "hidden", textOverflow: "ellipsis" } }}
            />
            <SettingsIcon sx={{ fontSize: 16, color: "text.disabled" }} />
          </ListItemButton>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100vh",
        }}
      >
        {/* Top Navbar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            height: NAVBAR_HEIGHT,
            backgroundColor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <Toolbar sx={{ px: 2, minHeight: `${NAVBAR_HEIGHT}px !important` }}>
            <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
              {/* Global Search Bar - Sharp Style */}
              <Box
                id="search-container"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: alpha(theme.palette.action.hover, 0.5),
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "4px",
                  width: 400,
                  maxWidth: "100%",
                  position: "relative",
                }}
              >
                <SearchIcon sx={{ fontSize: 18, color: "text.disabled", mr: 1 }} />
                <InputBase
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={handleSearch}
                  onFocus={(e) => setAnchorEl(e.currentTarget.parentElement as HTMLDivElement)}
                  sx={{ fontSize: "0.875rem", width: "100%", color: "text.primary" }}
                />
                
                {searching && <CircularProgress size={14} sx={{ ml: 1 }} />}

                <Popover
                  open={Boolean(anchorEl) && (searchResults.length > 0 || searching)}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transitionDuration={0}
                  slotProps={{
                    paper: {
                      sx: { width: 400, mt: 1, p: 1, borderRadius: "4px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }
                    }
                  }}
                >
                  <List disablePadding>
                    {searchResults.map((res) => (
                      <ListItem key={res.id} disablePadding>
                        <ListItemButton sx={{ borderRadius: "4px" }} onClick={() => setAnchorEl(null)}>
                          <ListItemText
                            primary={res.title}
                            secondary={res.snippet}
                            primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}
                            secondaryTypographyProps={{ fontSize: "0.75rem" }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Popover>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Badge badgeContent={4} color="error" variant="dot">
                <NotificationsIcon sx={{ fontSize: 22, color: "text.secondary" }} />
              </Badge>
              <Box sx={{ width: 1, height: 24, backgroundColor: "divider", mx: 0.5 }} />
              <ThemeToggle />
              <IconButton color={showChat ? "primary" : "default"} onClick={() => setShowChat(!showChat)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "4px", p: 0.5 }}>
                <ChatIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              backgroundColor: isLight ? "#fbfcfd" : "background.default",
              position: "relative",
            }}
          >
            <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
              {children}
            </Box>
          </Box>
          {showChat && <AIChatSidebar onClose={() => setShowChat(false)} />}
        </Box>

        {/* Thin Status Footer */}
        <Box
          sx={{
            height: FOOTER_HEIGHT,
            backgroundColor: isLight ? "#ffffff" : "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            px: 2,
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "success.main" }} />
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
              System Operational
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ my: 0.8 }} />
          <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: "text.disabled" }}>
            V1.0.4-SHARP
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: "text.secondary" }}>
            SQLite Persistence Active
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
