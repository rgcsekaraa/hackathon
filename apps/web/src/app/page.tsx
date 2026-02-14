"use client";

import { useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import InboxIcon from "@mui/icons-material/InboxOutlined";
import { useTheme, alpha } from "@mui/material/styles";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { WorkspaceProvider, useWorkspace } from "@/components/providers/WorkspaceProvider";
import { TaskCard } from "@/components/workspace/TaskCard";
import { StatusIndicator } from "@/components/workspace/StatusIndicator";
import { VoiceCapture } from "@/components/voice/VoiceCapture";
import { TextInput } from "@/components/input/TextInput";
import { ActionChips } from "@/components/input/ActionChips";

/**
 * Inner content of the mobile page that consumes workspace context.
 */
function MobileWorkspace() {
  const { components, serverStatus, sendAction } = useWorkspace();
  const theme = useTheme();
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
    <MobileLayout>
      {/* Header section */}
      <Box sx={{ pt: 1, pb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em", mb: 0.5 }}>
          Inbox
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StatusIndicator status={serverStatus} />
          <Box sx={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "text.disabled", mx: 0.5 }} />
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {components.length} {components.length === 1 ? "TASK" : "TASKS"}
          </Typography>
        </Box>
      </Box>

      {/* Task list */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", mb: 3 }}>
        {components.length === 0 ? (
          <Box
            sx={{
              py: 10,
              px: 3,
              textAlign: "center",
              backgroundColor: isLight ? "white" : alpha(theme.palette.background.paper, 0.4),
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <InboxIcon sx={{ fontSize: 24, color: "primary.main" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              All clear for now
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Speak or type to capture ideas and plan your workspace.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {components.map((comp) => (
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
        )}
      </Box>

      {/* Input area */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          backgroundColor: isLight ? "#f8fafc" : "background.default",
          pt: 1,
          pb: 2,
        }}
      >
        <ActionChips />
        <Box sx={{ display: "flex", gap: 1.5, mt: 2, alignItems: "center" }}>
          <VoiceCapture />
          <Box sx={{ flex: 1 }}>
            <TextInput />
          </Box>
        </Box>
      </Box>
    </MobileLayout>
  );
}

/**
 * Mobile page -- wraps the workspace in the provider.
 */
export default function MobilePage() {
  return (
    <WorkspaceProvider>
      <MobileWorkspace />
    </WorkspaceProvider>
  );
}
