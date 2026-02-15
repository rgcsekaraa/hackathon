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
import FolderIcon from "@mui/icons-material/FolderOutlined";
import { alpha, useTheme } from "@mui/material/styles";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { AIChatSidebar } from "@/components/AIChatSidebar";
import ChatIcon from "@mui/icons-material/ChatBubbleOutline";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import CircularProgress from "@mui/material/CircularProgress";
import Popover from "@mui/material/Popover";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHighOutlined";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";

const SIDEBAR_WIDTH = 260; // Slightly wider for M3 labels
const NAVBAR_HEIGHT = 64; 

interface DashboardLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { text: "Dashboard", icon: <HomeIcon />, active: true },
  { text: "Inbox", icon: <InboxIcon />, badge: 3 },
  { text: "Schedule", icon: <ScheduleIcon /> },
  { text: "Jobs", icon: <BuildIcon /> },
  { text: "Customers", icon: <PeopleIcon /> },
  { text: "Documents", icon: <DescriptionIcon /> },
];

/**
 * Dashboard layout for the web view -- M3 Refined.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const { user, logout, token } = useAuth();
  
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; snippet: string }>>([]);
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "background.default" }}>
      {/* M3 Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Sidebar Header */}
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, minHeight: NAVBAR_HEIGHT }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              backgroundColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "white",
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            O
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em", color: "text.primary" }}>
            ORBIT
          </Typography>
        </Box>

        <Divider sx={{ opacity: 0.5 }} />

        {/* M3 Navigation List */}
        <Box sx={{ overflow: "auto", flex: 1, p: 1.5 }}>
          <List sx={{ gap: 0.5 }}>
            {NAV_ITEMS.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={item.active}
                  sx={{
                    borderRadius: "12px",
                    mb: 0.5,
                    px: 2,
                    py: 1.2,
                    "&.Mui-selected": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                      "& .MuiListItemIcon-root": { color: "primary.main" },
                    },
                    "&:hover": { backgroundColor: alpha(theme.palette.action.hover, 0.4) },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: item.active ? "primary.main" : "text.secondary" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: item.active ? 700 : 600, letterSpacing: "0.01em" }}
                  />
                  {item.badge && (
                    <Badge 
                      badgeContent={item.badge} 
                      color="primary" 
                      sx={{ 
                        mr: 1,
                        "& .MuiBadge-badge": { fontWeight: 800, fontSize: "0.65rem" }
                      }} 
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ opacity: 0.5 }} />

        {/* User Profile Section */}
        <Box sx={{ p: 2 }}>
          <ListItemButton 
            sx={{ 
              borderRadius: "16px", 
              p: 1,
              backgroundColor: alpha(theme.palette.action.hover, 0.5),
              border: "1px solid",
              borderColor: "divider"
            }} 
            onClick={logout}
          >
            <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: "0.8rem", fontWeight: 700, bgcolor: "primary.main" }}>
              {user?.full_name?.[0] || "U"}
            </Avatar>
            <ListItemText
              primary={user?.full_name || "Enterprise User"}
              secondary="Sign Out"
              primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 700, noWrap: true }}
              secondaryTypographyProps={{ fontSize: "0.65rem", fontWeight: 600, color: "primary.main" }}
            />
          </ListItemButton>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top App Bar */}
        <AppBar 
          position="static" 
          color="inherit" 
          elevation={0} 
          sx={{ 
            borderBottom: "1px solid", 
            borderColor: "divider",
            backgroundColor: alpha(theme.palette.background.default, 0.5),
            backdropFilter: "blur(8px)"
          }}
        >
          <Toolbar sx={{ px: 3, minHeight: NAVBAR_HEIGHT }}>
            <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: alpha(theme.palette.action.hover, 0.6),
                  borderRadius: "14px",
                  px: 2,
                  py: 0.8,
                  width: 440,
                  maxWidth: "100%",
                  border: "1px solid",
                  borderColor: "divider"
                }}
              >
                <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 18 }} />
                <InputBase
                  placeholder="Universal Command (⌘ + K)"
                  fullWidth
                  value={searchQuery}
                  onChange={handleSearch}
                  onFocus={(e) => setAnchorEl(e.currentTarget.parentElement as HTMLDivElement)}
                  sx={{ fontSize: "0.85rem", fontWeight: 500 }}
                />
                {searching && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ThemeToggle />
              <IconButton 
                onClick={() => setShowChat(!showChat)}
                sx={{ 
                  borderRadius: "12px", 
                  color: showChat ? "primary.main" : "text.secondary",
                  backgroundColor: showChat ? alpha(theme.palette.primary.main, 0.1) : "transparent",
                  border: "1px solid",
                  borderColor: showChat ? "primary.main" : "divider"
                }}
              >
                <ChatIcon />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<AutoFixHighIcon />}
                size="small"
                sx={{ 
                  borderRadius: "12px", 
                  fontWeight: 800,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                COMMAND CENTER
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Box sx={{ flex: 1, overflow: "auto", position: "relative", p: 4 }}>
            <Box sx={{ maxWidth: 1400, mx: "auto" }}>
              {children}
            </Box>
          </Box>
          {showChat && <AIChatSidebar onClose={() => setShowChat(false)} />}
        </Box>

        {/* M3 Status Footer */}
        <Box sx={{ height: 32, px: 3, borderTop: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 3, backgroundColor: "background.paper" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "success.main", boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)" }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "0.02em" }}>ORBIT CORE STABLE</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700 }}>V1.2-ORBIT-DEMO</Typography>
        </Box>
      </Box>

      {/* Global Search Popover */}
      <Popover
        open={Boolean(anchorEl) && (searchResults.length > 0 || searching)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transitionDuration={150}
        slotProps={{
          paper: {
            sx: { width: 440, mt: 1, p: 1, borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }
          }
        }}
      >
        <List disablePadding>
          {searchResults.map((res) => (
            <ListItem key={res.id} disablePadding>
              <ListItemButton sx={{ borderRadius: "8px" }} onClick={() => setAnchorEl(null)}>
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
  );
}
