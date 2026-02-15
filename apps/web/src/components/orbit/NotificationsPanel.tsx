"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import Close from "@mui/icons-material/Close";
import DoneAll from "@mui/icons-material/DoneAll";

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
}

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: "n1",
    title: "New enquiry received",
    body: "Sarah Mitchell sent an enquiry about a leaking tap",
    time: "2m ago",
    read: false,
    type: "info",
  },
  {
    id: "n2",
    title: "Appointment confirmed",
    body: "Priya Patel confirmed the 2:30 PM meeting",
    time: "15m ago",
    read: false,
    type: "success",
  }
];

export default function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [items, setItems] = useState<Notification[]>(mockNotifications);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = items.filter((n) => !n.read).length;

  const iconMap: Record<string, React.ReactNode> = {
    info: <InfoOutlined sx={{ color: "info.main", fontSize: 22 }} />,
    warning: <WarningAmberOutlined sx={{ color: "warning.main", fontSize: 22 }} />,
    success: <CheckCircleOutline sx={{ color: "success.main", fontSize: 22 }} />,
  };

  const bgMap: Record<string, string> = {
    info: isDark ? "rgba(138,180,248,0.06)" : "rgba(26,115,232,0.04)",
    warning: isDark ? "rgba(253,214,99,0.06)" : "rgba(227,116,0,0.04)",
    success: isDark ? "rgba(129,201,149,0.06)" : "rgba(30,142,62,0.04)",
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? "100%" : 400,
          bgcolor: "background.default",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6" sx={{ color: "text.primary", fontSize: "1.1rem", fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} new`}
              size="small"
              sx={{
                bgcolor: isDark ? "rgba(138,180,248,0.15)" : "rgba(26,115,232,0.1)",
                color: "primary.main",
                height: 24,
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {unreadCount > 0 && (
            <IconButton
              size="small"
              onClick={markAllRead}
              aria-label="Mark all as read"
              sx={{ color: "primary.main" }}
            >
              <DoneAll fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose} aria-label="Close notifications" sx={{ color: "text.secondary" }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Notification list */}
      <List disablePadding sx={{ px: 1.5, py: 1 }}>
        {items.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No notifications</Typography>
            </Box>
        ) : items.map((n, idx) => (
          <Box key={n.id}>
            <ListItemButton
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                py: 2,
                px: 2,
                borderRadius: 2,
                bgcolor: !n.read ? bgMap[n.type] : "transparent",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                },
              }}
              onClick={() => setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
            >
              {/* Icon */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {iconMap[n.type]}
              </Box>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: "text.primary",
                      fontSize: "0.9rem",
                      fontWeight: n.read ? 400 : 600,
                      lineHeight: 1.3,
                    }}
                  >
                    {n.title}
                  </Typography>
                  {!n.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        flexShrink: 0,
                        ml: 1,
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.85rem",
                    lineHeight: 1.55,
                    mb: 0.75,
                  }}
                >
                  {n.body}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    opacity: 0.7,
                  }}
                >
                  {n.time}
                </Typography>
              </Box>
            </ListItemButton>
            {idx < items.length - 1 && (
              <Divider sx={{ borderColor: "divider", mx: 2, my: 0.5 }} />
            )}
          </Box>
        ))}
      </List>
    </Drawer>
  );
}
