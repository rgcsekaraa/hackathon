"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { alpha, useTheme } from "@mui/material/styles";

type StatusType = "listening" | "thinking" | "updating" | "synced" | "error";

const STATUS_CONFIG: Record<StatusType, { label: string; colorKey: string }> = {
  listening: { label: "Listening", colorKey: "primary" },
  thinking: { label: "Thinking", colorKey: "warning" },
  updating: { label: "Updating", colorKey: "info" },
  synced: { label: "Synced", colorKey: "success" },
  error: { label: "Error", colorKey: "error" },
};

interface StatusIndicatorProps {
  status: StatusType;
}

/**
 * Visual status indicator showing the current workspace state.
 * Includes a pulsing animation when actively processing.
 */
export function StatusIndicator({ status }: StatusIndicatorProps) {
  const theme = useTheme();
  const config = STATUS_CONFIG[status];
  const isActive = status === "listening" || status === "thinking" || status === "updating";

  const colorMap: Record<string, string> = {
    primary: theme.palette.primary.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info?.main || theme.palette.primary.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
  };

  const color = colorMap[config.colorKey] || theme.palette.primary.main;

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {/* Pulse dot */}
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 8px ${alpha(color, 0.5)}`,
          ...(isActive && {
            animation: "pulse 1.5s ease-in-out infinite",
            "@keyframes pulse": {
              "0%": { transform: "scale(1)", opacity: 1 },
              "50%": { transform: "scale(1.4)", opacity: 0.6 },
              "100%": { transform: "scale(1)", opacity: 1 },
            },
          }),
        }}
      />
      <Chip
        label={config.label}
        size="small"
        sx={{
          height: 22,
          fontSize: "0.7rem",
          fontWeight: 600,
          backgroundColor: alpha(color, 0.1),
          color: color,
          border: "none",
        }}
      />
    </Box>
  );
}
