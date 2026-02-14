"use client";

import { useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import { alpha, useTheme } from "@mui/material/styles";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkspaceProvider, useWorkspace } from "@/components/providers/WorkspaceProvider";
import { TaskCard } from "@/components/workspace/TaskCard";
import { StatusIndicator } from "@/components/workspace/StatusIndicator";
import InboxIcon from "@mui/icons-material/InboxOutlined";
import GridViewIcon from "@mui/icons-material/GridViewOutlined";

/**
 * Groups components by date for the dashboard timeline view.
 */
function groupByDate(components: Array<{
  id: string;
  title: string;
  description?: string;
  priority: "urgent" | "high" | "normal" | "low";
  date?: string;
  timeSlot?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}>) {
  const groups: Record<string, typeof components> = {};

  for (const comp of components) {
    const key = comp.date || "Unscheduled";
    if (!groups[key]) groups[key] = [];
    groups[key].push(comp);
  }

  return Object.entries(groups).sort(([a], [b]) => {
    if (a === "Unscheduled") return 1;
    if (b === "Unscheduled") return -1;
    return a.localeCompare(b);
  });
}

/**
 * Inner dashboard content consuming workspace context.
 */
function DashboardWorkspace() {
  const theme = useTheme();
  const { components, serverStatus, sendAction } = useWorkspace();
  const grouped = groupByDate(components);
  const isLight = theme.palette.mode === "light";

  const handleToggleComplete = useCallback(
    (id: string) => {
      sendAction("toggle_complete", id);
    },
    [sendAction]
  );

  const handleDelete = useCallback(
    (id: string) => {
      sendAction("delete", id);
    },
    [sendAction]
  );

  return (
    <DashboardLayout>
      <Box sx={{ height: "100%" }}>
        {/* Header row */}
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em", mb: 0.5 }}>
              Inbox
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              You have {components.length} {components.length === 1 ? "task" : "tasks"} in your workspace
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <StatusIndicator status={serverStatus} />
          </Box>
        </Box>

        {/* Timeline grid */}
        {components.length === 0 ? (
          <Box
            sx={{
              p: 10,
              textAlign: "center",
              backgroundColor: isLight ? "white" : alpha(theme.palette.background.paper, 0.4),
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              minHeight: 400,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <InboxIcon sx={{ fontSize: 32, color: "primary.main" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, letterSpacing: "-0.01em" }}>
              Your inbox is empty
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 400, fontWeight: 500 }}>
              Speak or type commands on your mobile device to populate your workspace.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {grouped.map(([date, items]) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={date}>
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                    {date}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled" }}>
                    {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {items.map((comp) => (
                    <TaskCard
                      key={comp.id}
                      id={comp.id}
                      title={comp.title}
                      description={comp.description}
                      priority={comp.priority}
                      date={comp.date}
                      timeSlot={comp.timeSlot}
                      completed={comp.completed}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </DashboardLayout>
  );
}

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Dashboard page -- wraps workspace in the provider.
 * Uses auth guard to ensure user is logged in.
 */
export default function DashboardPage() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth/login");
    }
  }, [token, loading, router]);

  if (loading || !token) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h6" color="text.secondary">Authenticating...</Typography>
      </Box>
    );
  }

  return (
    <WorkspaceProvider>
      <DashboardWorkspace />
    </WorkspaceProvider>
  );
}
