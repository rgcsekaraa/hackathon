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
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 1 }}>
      {CHIPS.map((chip) => (
        <Chip
          key={chip.label}
          label={chip.label.toUpperCase()} // Bold uppercase
          icon={chip.icon}
          size="medium" // Increased size
          onClick={() => sendUtterance(chip.command, "chip")}
          sx={{
            cursor: "pointer",
            height: 44, // Minimum mobile tap height
            borderRadius: "12px",
            fontSize: "0.85rem",
            fontWeight: 800, // Extra bold
            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.05),
            border: "2px solid", // Bolder border
            borderColor: alpha(theme.palette.primary.main, 0.2),
            color: "text.primary",
            px: 1,
            transition: "all 0.1s ease-in-out",
            "& .MuiChip-icon": { 
              color: "primary.main",
              fontSize: 20, // Larger icons
            },
            "&:hover, &:active": {
              backgroundColor: "primary.main",
              borderColor: "primary.main",
              color: "white",
              "& .MuiChip-icon": { color: "white" },
            },
            "& .MuiChip-label": {
              px: 1.5,
            }
          }}
        />
      ))}
    </Box>
  );
}
