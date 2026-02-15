"use client";

import { useEffect, useState, useRef } from "react";
import {
  Badge,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Popover,
  Typography,
  Avatar,
  Divider,
} from "@mui/material";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Call from "@mui/icons-material/Call";
import PersonAdd from "@mui/icons-material/PersonAdd";
import { useAuth } from "@/lib/auth-context";

interface NotificationEvent {
  id: string;
  type: "new_lead" | "lead_update" | "lead_decided" | "call_status" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function NotificationCenter() {
  const { token } = useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Audio for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // creating audio element for notification sound
    audioRef.current = new Audio("/sounds/notification.mp3"); // Ensure this file exists or handle error
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, "") 
      : "localhost:8000";
    
    const wsUrl = `${protocol}//${host}/ws/leads?token=${token}`;
    
    const connect = () => {
      console.log("Connecting to Notification WebSocket...");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Notification WebSocket Connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onclose = () => {
        console.log("Notification WebSocket Disconnected. Reconnecting...");
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket Error", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  const handleWebSocketMessage = (data: any) => {
    let newNotification: NotificationEvent | null = null;
    const now = new Date();

    switch (data.type) {
      case "new_lead":
        newNotification = {
          id: Date.now().toString(),
          type: "new_lead",
          title: "New Lead Received",
          message: `${data.lead?.customerName || data.lead?.customer_name || "Customer"} requires ${data.lead?.jobType || data.lead?.job_type || "service"}`,
          timestamp: now,
          read: false,
        };
        break;
      case "lead_update":
        newNotification = {
          id: Date.now().toString(),
          type: "lead_update",
          title: "Lead Updated",
          message: `${data.lead?.customerName || data.lead?.customer_name || data.lead?.id || "Lead"} - Status: ${data.lead?.status || "updated"}`,
          timestamp: now,
          read: false,
        };
        break;
      case "call_status":
        newNotification = {
          id: Date.now().toString(),
          type: "call_status",
          title: data.status === "started" ? "Incoming Call" : "Call Ended",
          message: `Call ${data.status || "updated"}: ${data.caller || "unknown caller"}`,
          timestamp: now,
          read: false,
        };
        break;
       case "lead_decided":
        newNotification = {
            id: Date.now().toString(),
            type: "lead_decided",
            title: "Lead Decision",
            message: `Lead ${data.decision} by tradie`,
            timestamp: now,
            read: false,
        }
        break;
    }

    if (newNotification) {
      setNotifications((prev) => [newNotification!, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
      playSound();
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Mark all as read on close? Or maybe just clear the badge
    setUnreadCount(0);
  };
  
  const getIcon = (type: string) => {
      switch(type) {
          case 'new_lead': return <PersonAdd color="primary" />;
          case 'call_status': return <Call color="success" />;
          case 'lead_decided': return <InfoOutlined color="info" />;
          default: return <NotificationsOutlined />;
      }
  }

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick} color="inherit">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsOutlined />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
            paper: {
                sx: { width: 360, maxHeight: 400, mt: 1.5 }
            }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <Box key={n.id}>
                <ListItem alignItems="flex-start" sx={{ bgcolor: n.read ? 'transparent' : 'action.hover' }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'background.paper' }}>
                        {getIcon(n.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={n.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {n.message}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {n.timestamp.toLocaleTimeString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </Box>
            ))
          )}
        </List>
      </Popover>
    </>
  );
}
