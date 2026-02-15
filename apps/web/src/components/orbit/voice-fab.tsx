"use client";

import { useState, useCallback, useEffect } from "react";
import Fab from "@mui/material/Fab";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slide from "@mui/material/Slide";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import MicNoneOutlined from "@mui/icons-material/MicNoneOutlined";
import MicOutlined from "@mui/icons-material/MicOutlined";
import Close from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useAuth } from "@/lib/auth-context";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
  useConnectionState,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import "@livekit/components-styles";

// Inner component to handle voice assistant state
function ActiveVoiceSession({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const isDark = theme.palette.mode === "dark";

  const lastTranscript = agentTranscriptions[agentTranscriptions.length - 1]?.text ?? "Listening...";

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 500 }}>
          {state === "listening" ? "Sophie is listening..." : "Sophie is thinking..."}
        </Typography>
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
          height: 64,
          mb: 2,
          bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          borderRadius: 2,
        }}
      >
        <BarVisualizer
          state={state}
          barCount={7}
          trackRef={audioTrack}
          style={{ height: "40px", gap: "4px" }}
          options={{ minHeight: 10, maxHeight: 40 }}
        />
      </Box>

      {/* Transcript */}
      <Box
        sx={{
          minHeight: 40,
          bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          borderRadius: 2,
          px: 2,
          py: 1.5,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: "text.primary",
            fontSize: "0.875rem",
            lineHeight: 1.6,
          }}
        >
          {lastTranscript}
        </Typography>
      </Box>
    </Box>
  );
}

export default function VoiceFab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { token: authToken } = useAuth(); // Auth token for API
  
  const [isOpen, setIsOpen] = useState(false);
  const [roomToken, setRoomToken] = useState("");
  const [url, setUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchToken = async () => {
    try {
      setIsConnecting(true);
      const res = await fetch("/api/voice/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken ?? ""}`,
        },
      });
      const data = await res.json();
      setRoomToken(data.token);
      setUrl(data.url);
      setIsOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setRoomToken(""); 
    } else {
      fetchToken();
    }
  }, [isOpen, authToken]);

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
          elevation={0}
          sx={{
            position: "fixed",
            bottom: isMobile ? 72 : 0,
            left: isMobile ? 0 : "auto",
            right: 0,
            width: isMobile ? "100%" : 380,
            zIndex: 1300,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            borderRadius: isMobile ? "16px 16px 0 0" : "16px 0 0 0",
            p: 3,
            pb: isMobile ? 4 : 3,
          }}
        >
          {roomToken && url && (
            <LiveKitRoom
              token={roomToken}
              serverUrl={url}
              connect={true}
              audio={true}
              video={false}
              onDisconnected={handleClose}
              data-lk-theme="default"
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
            width: 56,
            height: 56,
            bgcolor: isOpen ? fabBg : fabBg,
            color: fabColor,
            transition: "transform 0.1s ease, box-shadow 0.2s ease",
            "&:hover": {
              bgcolor: isDark ? "#AECBFA" : "#4285F4",
            },
          }}
        >
          {isOpen ? (
            <MicOutlined sx={{ fontSize: 26 }} />
          ) : (
            <MicNoneOutlined sx={{ fontSize: 26 }} />
          )}
        </Fab>
      </Box>
    </>
  );
}
