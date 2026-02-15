"use client";

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
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

function formatRelativeTime(timeStr: string): string {
  if (!timeStr) return "";
  // If it's already relative ("Just now", "2 min ago"), pass through
  if (timeStr.includes("ago") || timeStr.toLowerCase() === "just now") return timeStr;
  // Try to parse as date
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) return timeStr;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { notifications, markNotificationRead, markAllNotificationsRead } = useWorkspace();

  const unreadCount = notifications.filter((n) => !n.read).length;

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
              onClick={markAllNotificationsRead}
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
        {notifications.length === 0 && (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <NotificationsNoneOutlined
              sx={{
                fontSize: 52,
                color: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                mb: 2,
              }}
            />
            <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500, mb: 0.5 }}>
              All caught up
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", opacity: 0.7 }}>
              New notifications will appear here.
            </Typography>
          </Box>
        )}
        {notifications.map((n, idx) => (
          <Box key={n.id}>
            <ListItemButton
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                py: 2,
                px: 2,
                borderRadius: 2,
                bgcolor: !n.read && n.type ? bgMap[n.type] : "transparent",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                },
              }}
              onClick={() => markNotificationRead(n.id)}
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
                  {formatRelativeTime(n.time)}
                </Typography>
              </Box>
            </ListItemButton>
            {idx < notifications.length - 1 && (
              <Divider sx={{ borderColor: "divider", mx: 2, my: 0.5 }} />
            )}
          </Box>
        ))}
      </List>
    </Drawer>
  );
}
