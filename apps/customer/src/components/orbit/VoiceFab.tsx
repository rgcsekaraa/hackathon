"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useSpeechRecognition } from "@/lib/speech";

export default function VoiceFab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { sendUtterance, serverStatus } = useWorkspace();
  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const [pulseScale, setPulseScale] = useState(1);

  // Simulated pulse animation when listening
  useEffect(() => {
    if (!isListening) {
      setPulseScale(1);
      return;
    }
    let frame: number;
    let start: number;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;
      setPulseScale(1 + 0.15 * Math.sin(elapsed * 3));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isListening]);

  const handleToggle = useCallback(() => {
    if (isListening) {
      if (transcript.trim()) {
        sendUtterance(transcript, "voice");
      }
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, transcript, startListening, stopListening, sendUtterance]);

  const handleClose = useCallback(() => {
    if (isListening) stopListening();
  }, [isListening, stopListening]);

  const isDark = theme.palette.mode === "dark";
  const fabBg = isDark ? "#8AB4F8" : "#1A73E8";
  const fabColor = isDark ? "#0E0E0E" : "#FFFFFF";

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Listening sheet */}
      <Slide direction="up" in={isListening} mountOnEnter unmountOnExit>
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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 500 }}>
              {serverStatus === 'thinking' ? "Processing..." : "Sophie is listening..."}
            </Typography>
            <IconButton
              size="small"
              onClick={handleClose}
              aria-label="Stop listening"
              sx={{ color: "text.secondary" }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Visualizer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              height: 48,
              mb: 2,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 4,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  opacity: isListening ? 0.8 : 0.3,
                  height: isListening ? `${12 + Math.random() * 28}px` : 12,
                  transition: "height 0.15s ease",
                  animation: isListening ? `wave 0.6s ease-in-out ${i * 0.08}s infinite alternate` : "none",
                  "@keyframes wave": {
                    "0%": { height: 12 },
                    "100%": { height: 40 },
                  },
                }}
              />
            ))}
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
                color: transcript ? "text.primary" : "text.secondary",
                fontStyle: transcript ? "normal" : "italic",
                fontSize: "0.875rem",
                lineHeight: 1.6,
              }}
            >
              {transcript || "Speak now..."}
            </Typography>
          </Box>
        </Paper>
      </Slide>

      {/* Floating voice button */}
      <Box
        sx={{
          position: "fixed",
          bottom: isMobile ? 80 : 24,
          right: isMobile ? 16 : 24,
          zIndex: 1301,
        }}
      >
        {/* Pulse ring */}
        {isListening && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "primary.main",
              opacity: 0.2,
              transform: `translate(-50%, -50%) scale(${pulseScale + 0.3})`,
              transition: "transform 0.1s ease",
              pointerEvents: "none",
            }}
          />
        )}
        <Fab
          onClick={handleToggle}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
          sx={{
            width: 56,
            height: 56,
            bgcolor: isListening ? fabBg : fabBg,
            color: fabColor,
            transform: `scale(${isListening ? pulseScale : 1})`,
            transition: "transform 0.1s ease, box-shadow 0.2s ease",
            boxShadow: isListening ? `0 0 20px ${fabBg}` : 'none',
            "&:hover": {
              bgcolor: isDark ? "#AECBFA" : "#4285F4",
            },
          }}
        >
          {isListening ? (
            <MicOutlined sx={{ fontSize: 26 }} />
          ) : (
            <MicNoneOutlined sx={{ fontSize: 26 }} />
          )}
        </Fab>
      </Box>
    </>
  );
}
