"use client";

import { useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

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
  const { components, serverStatus, sendUtterance } = useWorkspace();

  const handleToggleComplete = useCallback(
    (id: string) => {
      const comp = components.find((c) => c.id === id);
      if (comp) {
        sendUtterance(
          comp.completed ? `Mark ${comp.title} as not done` : `Mark ${comp.title} as done`,
          "chip"
        );
      }
    },
    [components, sendUtterance]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const comp = components.find((c) => c.id === id);
      if (comp) {
        sendUtterance(`Delete ${comp.title}`, "chip");
      }
    },
    [components, sendUtterance]
  );

  return (
    <MobileLayout>
      {/* Status + workspace header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Your Workspace
        </Typography>
        <StatusIndicator status={serverStatus} />
      </Box>

      {/* Task list */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", mb: 2 }}>
        {components.length === 0 ? (
          <Box
            sx={{
              py: 6,
              textAlign: "center",
              border: 1,
              borderColor: "divider",
              borderStyle: "dashed",
              borderRadius: 3,
            }}
          >
            <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
              No tasks yet
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Speak or type to start planning your day
            </Typography>
          </Box>
        ) : (
          components.map((comp) => (
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
          ))
        )}
      </Box>

      {/* Input area */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          backgroundColor: "background.default",
          pt: 1,
          pb: 2,
        }}
      >
        <Divider sx={{ mb: 1.5 }} />
        <ActionChips />
        <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, alignItems: "center" }}>
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
