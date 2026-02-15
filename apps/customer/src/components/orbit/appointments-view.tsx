"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import AccessTime from "@mui/icons-material/AccessTime";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useMemo } from "react";
import PersonOutline from "@mui/icons-material/PersonOutline";
import { OrbitLoader } from "@/lib/orbit-ui";

interface Appointment {
  id: string;
  title: string;
  client: string;
  time: string;
  duration: string;
  status: "confirmed" | "pending" | "cancelled";
}

export default function AppointmentsView() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useAuth();
  const { components, connectionStatus } = useWorkspace();
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const todayAppointments = useMemo(() => {
    return components
      .filter((c) => c.type === "task")
      .map((c) => ({
        id: c.id,
        title: c.title,
        client: c.description || "General Lead",
        time: c.timeSlot || "TBD",
        duration: "30 min",
        status: c.completed ? "confirmed" : "pending",
      } as Appointment));
  }, [components]);

  const activeCount = useMemo(() => 
    todayAppointments.filter((a) => a.status !== "cancelled").length,
    [todayAppointments]
  );

  const statusColor: Record<string, { bg: string; text: string; border: string }> = {
    confirmed: {
      bg: isDark ? "rgba(129,201,149,0.12)" : "rgba(30,142,62,0.08)",
      text: isDark ? "#81C995" : "#1E8E3E",
      border: isDark ? "rgba(129,201,149,0.5)" : "rgba(30,142,62,0.4)",
    },
    pending: {
      bg: isDark ? "rgba(253,214,99,0.12)" : "rgba(227,116,0,0.08)",
      text: isDark ? "#FDD663" : "#E37400",
      border: isDark ? "rgba(253,214,99,0.5)" : "rgba(227,116,0,0.4)",
    },
    cancelled: {
      bg: isDark ? "rgba(242,139,130,0.12)" : "rgba(217,48,37,0.08)",
      text: isDark ? "#F28B82" : "#D93025",
      border: isDark ? "rgba(242,139,130,0.4)" : "rgba(217,48,37,0.3)",
    },
  };

  if (connectionStatus === "connecting") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
        <OrbitLoader />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 3, pb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            fontWeight: 500,
          }}
        >
          {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: "text.primary",
            mt: 0.75,
            fontWeight: 600,
            fontSize: { xs: "1.35rem", sm: "1.5rem" },
          }}
        >
          {"Today's Appointments"}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.85rem" }}>
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          {" \u00B7 "}
          {activeCount} active
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "divider", mx: 2 }} />

      {/* List */}
      <List disablePadding sx={{ px: 1, pt: 0.5 }}>
        {todayAppointments.map((apt) => {
          const sc = statusColor[apt.status];
          return (
            <ListItemButton
              key={apt.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 1,
                py: 2,
                px: 2,
                my: 0.5,
                borderRadius: 2,
                opacity: apt.status === "cancelled" ? 0.5 : 1,
                borderLeft: 3,
                borderColor: sc.border,
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "text.primary",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    textDecoration: apt.status === "cancelled" ? "line-through" : "none",
                  }}
                >
                  {apt.title}
                </Typography>
                <Chip
                  label={apt.status}
                  size="small"
                  sx={{
                    bgcolor: sc.bg,
                    color: sc.text,
                    height: 24,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <PersonOutline sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                    {apt.client}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <AccessTime sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                    {apt.time} ({apt.duration})
                  </Typography>
                </Box>
              </Box>
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
