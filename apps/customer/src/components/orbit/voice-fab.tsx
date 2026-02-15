"use client";

import { useState, useCallback } from "react";
import Fab from "@mui/material/Fab";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slide from "@mui/material/Slide";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import MicOutlined from "@mui/icons-material/MicOutlined";
import Close from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
} from "@livekit/components-react";
import "@livekit/components-styles";

// Inner component to handle voice assistant state
function ActiveVoiceSession({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const isDark = theme.palette.mode === "dark";

  const lastTranscript = agentTranscriptions[agentTranscriptions.length - 1]?.text ?? "";

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {state === "listening" && (
                <Box sx={{
                    width: 8, height: 8, borderRadius: "50%", bgcolor: "#F44336",
                    animation: "pulse 1.5s infinite"
                }} />
            )}
            <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 600 }}>
            {state === "listening" ? "Listening..." : "Thinking..."}
            </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Visualizer */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 80,
          mb: 2,
          bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
          borderRadius: 3,
          border: 1,
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        }}
      >
        <BarVisualizer
          state={state}
          barCount={7}
          trackRef={audioTrack}
          style={{ height: "50px", gap: "6px" }}
          options={{ minHeight: 12, maxHeight: 48 }}
        />
      </Box>

      {/* Transcript */}
      <Box
        sx={{
          minHeight: 60,
          maxHeight: 120,
          overflowY: "auto",
          bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 2,
          px: 2,
          py: 1.5,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: lastTranscript ? "text.primary" : "text.secondary",
            fontSize: "0.95rem",
            lineHeight: 1.5,
            fontStyle: lastTranscript ? "normal" : "italic",
          }}
        >
          {lastTranscript || "Say something like \"Show me my jobs for tomorrow\"..."}
        </Typography>
      </Box>
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>
    </Box>
  );
}

export default function VoiceFab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { token: authToken } = useAuth(); // Auth token for API
  
  const { agentStage, lastVoiceEvent } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [roomToken, setRoomToken] = useState("");
  const [url, setUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"tradie_copilot" | "receptionist">("tradie_copilot");

  const fetchToken = async (selectedMode: "tradie_copilot" | "receptionist") => {
    try {
      setIsConnecting(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/voice/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken ?? ""}`,
        },
        body: JSON.stringify({ mode: selectedMode }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to get voice token");
      }

      const data = await res.json();
      if (!data.token || !data.url) {
          throw new Error("Invalid token response");
      }

      setRoomToken(data.token);
      setUrl(data.url);
      setIsOpen(true);
    } catch (e) {
      console.error(e);
      setError("Failed to connect to AI Assistant");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setRoomToken(""); 
    } else {
      fetchToken(mode);
    }
  }, [isOpen, authToken, mode]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setRoomToken("");
  }, []);

  const isDark = theme.palette.mode === "dark";
  const fabBg = isDark ? "#8AB4F8" : "#1A73E8";
  const fabColor = isDark ? "#0E0E0E" : "#FFFFFF";

  return (
    <>
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={4}
          sx={{
            position: "fixed",
            bottom: isMobile ? 80 : 24,
            right: isMobile ? 16 : 96,
            width: isMobile ? "calc(100% - 32px)" : 360,
            zIndex: 1300,
            bgcolor: "background.paper",
            borderRadius: 4,
            p: 3,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ mb: 1.5 }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, next) => next && setMode(next)}
              size="small"
              fullWidth
              disabled={isOpen || isConnecting}
            >
              <ToggleButton value="tradie_copilot">Tradie Copilot</ToggleButton>
              <ToggleButton value="receptionist">Receptionist</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Agent Stage: {agentStage}
            </Typography>
            {lastVoiceEvent && (
              <Typography variant="body2" sx={{ color: "text.primary", mt: 0.5 }}>
                {lastVoiceEvent}
              </Typography>
            )}
          </Box>
          {roomToken && url && (
            <LiveKitRoom
              token={roomToken}
              serverUrl={url}
              connect={true}
              audio={true}
              video={false}
              onDisconnected={handleClose}
              data-lk-theme="default"
              options={{ adaptiveStream: true }}
            >
              <ActiveVoiceSession onClose={handleClose} />
              <RoomAudioRenderer />
            </LiveKitRoom>
          )}
        </Paper>
      </Slide>

      <Box
        sx={{
          position: "fixed",
          bottom: isMobile ? 80 : 24,
          right: isMobile ? 16 : 24,
          zIndex: 1301,
        }}
      >
        <Fab
          onClick={handleToggle}
          disabled={isConnecting}
          aria-label={isOpen ? "Stop voice input" : "Start voice input"}
          sx={{
            width: 64,
            height: 64,
            bgcolor: isOpen ? "#F44336" : fabBg,
            color: "#FFF",
            boxShadow: isOpen ? "0 0 20px rgba(244, 67, 54, 0.4)" : 6,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              bgcolor: isOpen ? "#D32F2F" : (isDark ? "#AECBFA" : "#1557B0"),
              transform: "scale(1.05)",
            },
            "&:disabled": {
                bgcolor: "action.disabledBackground",
            }
          }}
        >
          {isConnecting ? (
            <CircularProgress size={24} color="inherit" />
          ) : isOpen ? (
            <Close sx={{ fontSize: 28 }} />
          ) : (
            <MicOutlined sx={{ fontSize: 28 }} />
          )}
        </Fab>
      </Box>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </>
  );
}
