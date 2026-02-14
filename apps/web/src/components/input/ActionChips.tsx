"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhoneIcon from "@mui/icons-material/Phone";
import TimerIcon from "@mui/icons-material/Timer";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";

interface ActionChipConfig {
  label: string;
  command: string;
  icon: React.ReactElement;
}

const CHIPS: ActionChipConfig[] = [
  { label: "Urgent", command: "Make it urgent", icon: <PriorityHighIcon sx={{ fontSize: 16 }} /> },
  { label: "Tomorrow", command: "Schedule for tomorrow", icon: <CalendarTodayIcon sx={{ fontSize: 16 }} /> },
  { label: "Call", command: "Add a call task", icon: <PhoneIcon sx={{ fontSize: 16 }} /> },
  { label: "1h", command: "Estimate one hour", icon: <TimerIcon sx={{ fontSize: 16 }} /> },
];

/**
 * Quick action chips for common workspace commands.
 * Tapping a chip sends a predefined command as a "chip" source utterance.
 */
export function ActionChips() {
  const { sendUtterance } = useWorkspace();

  return (
    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
      {CHIPS.map((chip) => (
        <Chip
          key={chip.label}
          label={chip.label}
          icon={chip.icon}
          size="small"
          onClick={() => sendUtterance(chip.command, "chip")}
          sx={{
            cursor: "pointer",
            transition: "all 0.15s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: 1,
            },
            "&:active": {
              transform: "translateY(0)",
            },
          }}
        />
      ))}
    </Box>
  );
}
