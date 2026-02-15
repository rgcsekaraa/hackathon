"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import PhoneForwardedIcon from "@mui/icons-material/PhoneForwardedOutlined";
import PlayCircleIcon from "@mui/icons-material/PlayCircleOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHighOutlined";
import { alpha, useTheme } from "@mui/material/styles";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";

const DEMO_SCENARIOS = [
  {
    title: "Kitchen Repair Call",
    utterance: "Hi, I'm calling from 42 Wallaby Way. My kitchen sink is leaking heavily and I need a plumber urgently today. My name is P. Sherman.",
    color: "#6366f1"
  },
  {
    title: "Project Milestone",
    utterance: "Schedule a project review with the electrical team for next Tuesday at 2pm. Mark it as high priority.",
    color: "#10b981"
  },
  {
    title: "New Lead",
    utterance: "Received a new lead: John Wick needs an estimate for a full house rewiring in Sydney by tomorrow afternoon.",
    color: "#f59e0b"
  }
];

/**
 * Command Center Widget for Demo Emulation and Call Handling.
 */
export function CommandCenter() {
  const theme = useTheme();
  const { sendUtterance, sendAction } = useWorkspace();
  const [activeCall, setActiveCall] = useState<string | null>(null);

  const simulateCall = (text: string) => {
    setActiveCall("INCOMING CALL...");
    setTimeout(() => {
      sendUtterance(text, "voice");
      setActiveCall(null);
    }, 1500);
  };

  const clearWorkspace = () => {
    // In a real app, this would be a specific command or multiple delete calls
    // For demo, we emulate individual deletes or a "reset" intent
    sendUtterance("Clear my entire workspace for a new demo", "chip");
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "24px",
        backgroundColor: alpha(theme.palette.background.paper, 0.4),
        backdropFilter: "blur(12px)",
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background Accent */}
      <Box
        sx={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
          zIndex: 0
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <AutoFixHighIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            COMMAND CENTER
          </Typography>
        </Box>

        <Stack spacing={3}>
          {/* Call Simulator */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.disabled", mb: 1.5, display: "block", letterSpacing: "0.1em" }}>
              INBOUND CALL SIMULATOR
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              {DEMO_SCENARIOS.map((scenario) => (
                <Button
                  key={scenario.title}
                  variant="outlined"
                  size="small"
                  onClick={() => simulateCall(scenario.utterance)}
                  disabled={!!activeCall}
                  startIcon={<PhoneForwardedIcon />}
                  sx={{
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: alpha(scenario.color, 0.3),
                    color: scenario.color,
                    "&:hover": {
                      borderColor: scenario.color,
                      backgroundColor: alpha(scenario.color, 0.05)
                    }
                  }}
                >
                  {scenario.title}
                </Button>
              ))}
            </Stack>
            {activeCall && (
              <Typography variant="caption" sx={{ mt: 1, display: "block", color: "error.main", fontWeight: 900, animation: "blink 1s infinite" }}>
                {activeCall}
              </Typography>
            )}
          </Box>

          {/* Demo Controls */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.disabled", mb: 1.5, display: "block", letterSpacing: "0.1em" }}>
              DEMO UTILITIES
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={clearWorkspace}
                startIcon={<RestartAltIcon />}
                sx={{
                  borderRadius: "14px",
                  bgcolor: "surfaceVariant.main",
                  color: "text.primary",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "surfaceVariant.dark" }
                }}
              >
                Reset Workspace
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <style jsx global>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </Paper>
  );
}
