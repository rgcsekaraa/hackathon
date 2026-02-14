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
        mb: 2, // More space between cards
        transition: "all 0.2s ease-in-out",
        opacity: completed ? 0.7 : 1,
        borderRadius: "20px", // More rounded rugged look
        border: "2px solid",
        borderColor: completed ? "divider" : alpha(priorityCfg.color, 0.3),
        boxShadow: completed ? "none" : `0 4px 12px ${alpha(priorityCfg.color, 0.1)}`,
        "&:hover": {
          borderColor: priorityCfg.color,
          backgroundColor: alpha(priorityCfg.color, 0.02),
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          {/* Larger Checkbox area */}
          <IconButton 
            onClick={() => onToggleComplete?.(id)}
            sx={{ 
              mt: -0.5,
              p: 1.5,
              color: completed ? "success.main" : "text.secondary",
              "& .MuiSvgIcon-root": { fontSize: 32 } // Big checkboxes
            }}
          >
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800, // Extra bold
                  fontSize: "1.1rem",
                  color: "text.primary",
                  textDecoration: completed ? "line-through" : "none",
                  flexGrow: 1,
                }}
              >
                {title}
              </Typography>
              
              <Chip
                label={timeSlot ? (TIME_SLOT_LABELS[timeSlot] || timeSlot) : "ALL DAY"}
                variant="filled"
                sx={{ 
                  height: 28, 
                  fontSize: "0.75rem", 
                  fontWeight: 900, 
                  bgcolor: "text.primary",
                  color: "background.paper",
                  borderRadius: "8px"
                }}
              />
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
              {priority !== "normal" && (
                <Chip 
                  label={priorityCfg.label.toUpperCase()} 
                  sx={{ 
                    height: 24, 
                    fontSize: "0.7rem", 
                    fontWeight: 900, 
                    bgcolor: priorityCfg.color, 
                    color: "white",
                    borderRadius: "6px",
                    px: 0.5
                  }}
                />
              )}
              {date && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.8rem" }}>
                    {date}
                  </Typography>
                </Box>
              )}
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontSize: "0.95rem", // Larger text
                fontWeight: 500,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                opacity: 0.9,
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
