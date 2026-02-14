"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhoneIcon from "@mui/icons-material/Phone";
import TimerIcon from "@mui/icons-material/Timer";
import { alpha, useTheme } from "@mui/material/styles";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";

interface ActionChipConfig {
  label: string;
  command: string;
  icon: React.ReactElement;
}

const CHIPS: ActionChipConfig[] = [
  { label: "Urgent", command: "Make it urgent", icon: <PriorityHighIcon sx={{ fontSize: 14 }} /> },
  { label: "Tomorrow", command: "Schedule for tomorrow", icon: <CalendarTodayIcon sx={{ fontSize: 14 }} /> },
  { label: "Call", command: "Add a call task", icon: <PhoneIcon sx={{ fontSize: 14 }} /> },
  { label: "1h", command: "Estimate one hour", icon: <TimerIcon sx={{ fontSize: 14 }} /> },
];

/**
 * Quick action chips for common workspace commands.
 * Refined for a professional dashboard look with minimal borders and subtle interactions.
 */
export function ActionChips() {
  const { sendUtterance } = useWorkspace();
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
      {CHIPS.map((chip) => (
        <Chip
          key={chip.label}
          label={chip.label}
          icon={chip.icon}
          onClick={() => sendUtterance(chip.command, "chip")}
          sx={{
            cursor: "pointer",
            height: 40,
            borderRadius: "12px",
            fontSize: "0.8rem",
            fontWeight: 700,
            backgroundColor: alpha(theme.palette.surfaceVariant.main, 0.4),
            border: "1px solid",
            borderColor: "divider",
            color: "text.primary",
            px: 0.5,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "& .MuiChip-icon": { 
              color: "primary.main",
              fontSize: 18,
            },
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderColor: "primary.main",
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
            },
            "&:active": {
              transform: "scale(0.95)",
            },
            "& .MuiChip-label": {
              px: 1,
            }
          }}
        />
      ))}
    </Box>
  );
}
