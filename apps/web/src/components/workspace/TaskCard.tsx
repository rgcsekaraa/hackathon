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
      id={id}
      variant="outlined"
      sx={{
        p: 0,
        mb: 1,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: completed ? 0.6 : 1,
        borderRadius: "16px", // M3 Card Radius
        "&:hover": {
          borderColor: "primary.main",
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          {/* Status Checkbox replacement with M3 circle */}
          <IconButton 
            size="small" 
            onClick={() => onToggleComplete?.(id)}
            sx={{ mt: 0.25, color: completed ? "success.main" : "text.disabled" }}
          >
            {completed ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "text.primary",
                  textDecoration: completed ? "line-through" : "none",
                }}
              >
                {title}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                label={timeSlot ? (TIME_SLOT_LABELS[timeSlot] || timeSlot) : "ALL DAY"}
                size="small"
                variant="filled"
                sx={{ 
                  height: 20, 
                  fontSize: "0.65rem", 
                  fontWeight: 800, 
                  bgcolor: alpha(theme.palette.action.hover, 0.5),
                  color: "text.secondary",
                  borderRadius: "6px"
                }}
              />
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 0.8 }}>
              {priority !== "normal" && (
                <Chip 
                  label={priorityCfg.label} 
                  size="small"
                  sx={{ 
                    height: 18, 
                    fontSize: "0.6rem", 
                    fontWeight: 900, 
                    bgcolor: alpha(priorityCfg.color, 0.1), 
                    color: priorityCfg.color,
                    borderRadius: "4px",
                    textTransform: "uppercase"
                  }}
                />
              )}
              {date && (
                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.7rem", mt: 0.2 }}>
                   {date}
                </Typography>
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: "0.8rem",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
