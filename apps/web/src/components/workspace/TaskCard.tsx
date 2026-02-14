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
  urgent: { label: "Urgent", color: "#ef4444" },
  high: { label: "High", color: "#f59e0b" },
  normal: { label: "Normal", color: "#6366f1" },
  low: { label: "Low", color: "#94a3b8" },
} as const;

const TIME_SLOT_LABELS: Record<string, string> = {
  early_morning: "Early Morning",
  morning: "Morning",
  late_morning: "Late Morning",
  noon: "Noon",
  afternoon: "Afternoon",
  late_afternoon: "Late Afternoon",
  evening: "Evening",
};

/**
 * Workspace task card with priority indicator, time slot badge,
 * completion toggle, and delete action.
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

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        borderLeft: 4,
        borderColor: priorityCfg.color,
        backgroundColor: completed
          ? alpha(theme.palette.success.main, 0.06)
          : "background.paper",
        mb: 1.5,
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: completed ? 0.7 : 1,
        "&:hover": {
          transform: "translateX(4px)",
          boxShadow: `0 4px 20px ${alpha(priorityCfg.color, 0.15)}`,
        },
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          {/* Completion toggle */}
          <IconButton
            size="small"
            onClick={() => onToggleComplete?.(id)}
            sx={{
              mt: 0.25,
              color: completed ? "success.main" : "text.secondary",
              p: 0.5,
            }}
          >
            {completed ? (
              <CheckCircleIcon fontSize="small" />
            ) : (
              <CheckCircleOutlineIcon fontSize="small" />
            )}
          </IconButton>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                textDecoration: completed ? "line-through" : "none",
                color: completed ? "text.secondary" : "text.primary",
                lineHeight: 1.4,
              }}
            >
              {title}
            </Typography>
            {description && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                {description}
              </Typography>
            )}

            {/* Metadata badges */}
            <Box sx={{ display: "flex", gap: 0.75, mt: 1, flexWrap: "wrap" }}>
              {priority !== "normal" && (
                <Chip
                  label={priorityCfg.label}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    backgroundColor: alpha(priorityCfg.color, 0.12),
                    color: priorityCfg.color,
                    border: `1px solid ${alpha(priorityCfg.color, 0.3)}`,
                  }}
                />
              )}
              {timeSlot && (
                <Chip
                  label={TIME_SLOT_LABELS[timeSlot] || timeSlot}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.7rem" }}
                />
              )}
              {date && (
                <Chip
                  label={date}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.7rem" }}
                />
              )}
            </Box>
          </Box>

          {/* Delete button */}
          <IconButton
            size="small"
            onClick={() => onDelete?.(id)}
            sx={{
              color: "text.secondary",
              opacity: 0.5,
              "&:hover": { opacity: 1, color: "error.main" },
              p: 0.5,
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
