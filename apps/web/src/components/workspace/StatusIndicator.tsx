"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

type StatusType = "listening" | "thinking" | "updating" | "synced" | "error";

const STATUS_CONFIG: Record<StatusType, { label: string; colorKey: string }> = {
  listening: { label: "Capturing", colorKey: "primary" },
  thinking: { label: "Processing", colorKey: "warning" },
  updating: { label: "Updating", colorKey: "info" },
  synced: { label: "Synced", colorKey: "success" },
  error: { label: "Error", colorKey: "error" },
};

interface StatusIndicatorProps {
  status: StatusType;
}

/**
 * Visual status indicator showing the current workspace state.
 * Refined for a production feel with professional labels and micro-animations.
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
      {/* Micro-dot Indicator */}
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: color,
          ...(isActive && {
            animation: "pulseMicro 2s ease-in-out infinite",
            "@keyframes pulseMicro": {
              "0%": { opacity: 1 },
              "50%": { opacity: 0.4 },
              "100%": { opacity: 1 },
            },
          }),
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: "text.secondary",
          fontSize: "0.75rem",
          letterSpacing: "0.02em",
        }}
      >
        {config.label}
      </Typography>
    </Box>
  );
}
