"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { alpha, useTheme } from "@mui/material/styles";

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  priority: "urgent" | "high" | "normal" | "low";
  date?: string;
  timeSlot?: string;
  completed: boolean;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.08)" },
  high: { label: "High", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.08)" },
  normal: { label: "Normal", color: "#6366f1", bgColor: "rgba(99, 102, 241, 0.08)" },
  low: { label: "Low", color: "#94a3b8", bgColor: "rgba(148, 163, 184, 0.08)" },
} as const;

const TIME_SLOT_LABELS: Record<string, string> = {
  early_morning: "8:30 AM",
  morning: "10:00 AM",
  late_morning: "11:30 AM",
  noon: "12:00 PM",
  afternoon: "2:00 PM",
  late_afternoon: "4:30 PM",
  evening: "7:00 PM",
};

/**
 * Workspace task card - Redesigned for production-grade high-density dashboard.
 * Horizontal layout inspired by Sophiie.ai Inbox.
 */
export function TaskCard({
  id,
  title,
  description,
  completed,
  priority = "normal",
  date,
  timeSlot,
  onToggleComplete,
  onDelete,
}: TaskCardProps) {
  const theme = useTheme();

  const priorityCfg = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;

  return (
    <Card
      sx={{
        mb: 2,
        position: "relative",
        overflow: "visible",
        backgroundColor: "background.paper",
        borderRadius: "16px",
        transition: "all 0.2s ease",
        border: "1px solid",
        borderColor: "divider",
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      {/* Priority Accent Strip */}
      <Box
        sx={{
          position: "absolute",
          left: -1,
          top: 12,
          bottom: 12,
          width: 4,
          borderRadius: "0 4px 4px 0",
          backgroundColor: priorityCfg.color,
          boxShadow: `2px 0 8px ${alpha(priorityCfg.color, 0.4)}`,
        }}
      />

      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <IconButton 
            onClick={() => onToggleComplete?.(id)}
            sx={{ 
              mt: -0.25,
              p: 0.5,
              color: completed ? "success.main" : "text.disabled",
              transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              "& .MuiSvgIcon-root": { fontSize: 24 }
            }}
          >
            {completed ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  textDecoration: completed ? "line-through" : "none",
                  opacity: completed ? 0.6 : 1,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>
              {timeSlot && (
                <Chip
                  label={TIME_SLOT_LABELS[timeSlot] || timeSlot}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    borderRadius: "4px"
                  }}
                />
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: "0.85rem",
                lineHeight: 1.4,
                mb: 1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                opacity: completed ? 0.5 : 0.8,
              }}
            >
              {description}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {date && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.disabled" }}>
                  <ScheduleIcon sx={{ fontSize: 12 }} />
                  <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 600 }}>
                    {date}
                  </Typography>
                </Box>
              )}
              <Box sx={{ flex: 1 }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: priorityCfg.color, 
                  fontWeight: 800, 
                  fontSize: "0.6rem",
                  letterSpacing: "0.05em"
                }}
              >
                {priority.toUpperCase()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
