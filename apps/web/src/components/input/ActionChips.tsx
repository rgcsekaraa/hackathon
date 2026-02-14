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
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {CHIPS.map((chip) => (
        <Chip
          key={chip.label}
          label={chip.label}
          icon={chip.icon}
          size="small"
          onClick={() => sendUtterance(chip.command, "chip")}
          variant="outlined"
          sx={{
            cursor: "pointer",
            borderRadius: 1.5,
            fontSize: "0.75rem",
            fontWeight: 600,
            borderColor: "divider",
            backgroundColor: "background.paper",
            color: "text.secondary",
            transition: "all 0.15s ease",
            "& .MuiChip-icon": {
              color: "text.disabled",
              transition: "color 0.15s ease",
            },
            "&:hover": {
              borderColor: "primary.main",
              color: "primary.main",
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              "& .MuiChip-icon": {
                color: "primary.main",
              },
            },
            "&:active": {
              transform: "scale(0.98)",
            },
          }}
        />
      ))}
    </Box>
  );
}
