"use client";

import { useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid"; // Revert to standard Grid
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { alpha, useTheme } from "@mui/material/styles";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkspaceProvider, useWorkspace } from "@/components/providers/WorkspaceProvider";
import { TaskCard } from "@/components/workspace/TaskCard";
import { StatusIndicator } from "@/components/workspace/StatusIndicator";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
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
      <Box sx={{ height: "100%", pt: 1 }}>
        {/* Header row */}
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.03em", mb: 0 }}>
              Inbox
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.05em" }}>
              {components.length} {components.length === 1 ? "task" : "tasks"} total
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <StatusIndicator status={serverStatus} />
          </Box>
        </Box>

        {/* Operational Grid */}
        <Grid container spacing={3}>
          {/* Top Row: Command Center & Stats */}
          <Grid item xs={12} lg={8}>
            <CommandCenter />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                borderRadius: "24px",
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2
              }}
            >
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, color: "primary.main", lineHeight: 1 }}>
                  {components.length}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", letterSpacing: "0.05em" }}>
                  ACTIVE ORBIT ITEMS
                </Typography>
              </Box>
              <Divider sx={{ opacity: 0.1 }} />
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, color: "success.main", lineHeight: 1 }}>
                  {components.filter(c => c.completed).length}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", letterSpacing: "0.05em" }}>
                  RESOLVED TODAY
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Main Content: Timeline */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2, mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
              <GridViewIcon sx={{ color: "text.secondary" }} />
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
                CORE TIMELINE
              </Typography>
            </Box>

            {components.length === 0 ? (
              <Box
                sx={{
                  p: 8,
                  textAlign: "center",
                  backgroundColor: alpha(theme.palette.background.paper, 0.4),
                  backdropFilter: "blur(10px)",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "24px",
                  minHeight: 300,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <InboxIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Orbit is currently clear
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  Use the Command Center to simulate inbound calls or load a demo scenario.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {grouped.map(([date, items]) => (
                  <Grid item xs={12} md={6} lg={3} key={date}>
                    <Box
                      sx={{
                        mb: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 900, color: "text.primary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {date}
                      </Typography>
                      <Chip 
                        label={`${items.length} ${items.length === 1 ? 'TASK' : 'TASKS'}`}
                        size="small"
                        sx={{ height: 20, fontSize: "0.6rem", fontWeight: 800, bgcolor: "surfaceVariant.main" }}
                      />
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
          </Grid>
        </Grid>
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
