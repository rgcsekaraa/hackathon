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
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Workspace
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {components.length} {components.length === 1 ? "item" : "items"} in workspace
            </Typography>
          </Box>
          <StatusIndicator status={serverStatus} />
        </Box>

        {/* Timeline grid */}
        {components.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              border: 1,
              borderColor: "divider",
              borderStyle: "dashed",
              borderRadius: 3,
              minHeight: 300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              Waiting for input
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 400 }}>
              Open the mobile view to speak or type commands. Tasks and timelines
              will appear here as they are created.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {grouped.map(([date, items]) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={date}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    backgroundColor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 3,
                  }}
                >
                  {/* Date header */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {date}
                    </Typography>
                    <Chip
                      label={`${items.length}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        minWidth: 28,
                      }}
                    />
                  </Box>

                  {/* Task cards */}
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
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </DashboardLayout>
  );
}

/**
 * Dashboard page -- wraps workspace in the provider.
 * Uses the same session ID so it syncs with the mobile view.
 */
export default function DashboardPage() {
  return (
    <WorkspaceProvider>
      <DashboardWorkspace />
    </WorkspaceProvider>
  );
}
