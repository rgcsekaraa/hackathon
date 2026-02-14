"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
  priority,
  date,
  timeSlot,
  completed,
  onToggleComplete,
  onDelete,
}: TaskCardProps) {
  const theme = useTheme();
  const priorityCfg = PRIORITY_CONFIG[priority];
  const isLight = theme.palette.mode === "light";

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        mb: 1,
        transition: "all 0.15s ease-in-out",
        opacity: completed ? 0.6 : 1,
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.3),
          backgroundColor: isLight ? alpha(theme.palette.primary.main, 0.01) : alpha(theme.palette.primary.main, 0.04),
          "& .delete-btn": { opacity: 1 },
        },
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          {/* Header Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "text.primary",
                  textDecoration: completed ? "line-through" : "none",
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </Typography>
              
              {/* Status Indicator Dot */}
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: priorityCfg.color }} />
              
              {/* Right Aligned Metadata */}
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                {timeSlot ? (TIME_SLOT_LABELS[timeSlot] || timeSlot) : "All day"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {priority !== "normal" && (
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: priorityCfg.color,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  • {priorityCfg.label}
                </Typography>
              )}
              {date && (
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                   | {date}
                </Typography>
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontSize: "0.875rem",
                lineHeight: 1.5,
              }}
            >
              {description || "No additional details provided for this task."}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={() => onToggleComplete?.(id)}
              sx={{
                color: completed ? "success.main" : "text.secondary",
                backgroundColor: completed ? alpha(theme.palette.success.main, 0.08) : "transparent",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: completed ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              {completed ? <CheckCircleIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
            </IconButton>
            
            <IconButton
              className="delete-btn"
              size="small"
              onClick={() => onDelete?.(id)}
              sx={{
                color: "error.main",
                opacity: 0,
                transition: "all 0.15s",
                "&:hover": { backgroundColor: alpha(theme.palette.error.main, 0.08) },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
