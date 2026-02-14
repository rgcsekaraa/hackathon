"use client";

import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import { alpha, useTheme } from "@mui/material/styles";

import { useSpeechRecognition } from "@/lib/speech";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

/**
 * Voice capture component with mic button and live transcript.
 * Sends the final transcript as an utterance to the workspace backend.
 */
export function VoiceCapture() {
  const theme = useTheme();
  const { sendUtterance } = useWorkspace();
  const [interimText, setInterimText] = useState("");

  const handleResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isFinal) {
        sendUtterance(transcript.trim(), "voice");
        setInterimText("");
      } else {
        setInterimText(transcript);
      }
    },
    [sendUtterance]
  );

  const { isListening, isSupported, startListening, stopListening } =
    useSpeechRecognition({
      onResult: handleResult,
      language: "en-AU",
      continuous: false,
    });

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      setInterimText("");
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isSupported) {
    return (
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Voice input not supported in this browser
      </Typography>
    );
  }

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      gap: 3, 
      width: "100%",
      py: 2
    }}>
      {/* Massive Hero Mic Button */}
      <IconButton
        onClick={handleMicToggle}
        sx={{
          width: 96, // Massive button
          height: 96,
          borderRadius: "28px", // M3 Extra Large button
          backgroundColor: isListening ? "error.main" : "primary.main",
          color: "white",
          boxShadow: isListening 
            ? `0 0 30px ${alpha(theme.palette.error.main, 0.6)}` 
            : `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          flexShrink: 0,
          "& .MuiSvgIcon-root": { fontSize: 44 }, // Huge icon
          "&:hover": {
            transform: "scale(1.05)",
            backgroundColor: isListening ? "error.dark" : "primary.dark",
          },
          "&:active": {
            transform: "scale(0.95)",
          },
          ...(isListening && {
            animation: "micPulse 1.5s infinite ease-in-out",
            "@keyframes micPulse": {
              "0%": { transform: "scale(1)", boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.7)}` },
              "70%": { transform: "scale(1.1)", boxShadow: `0 0 0 20px ${alpha(theme.palette.error.main, 0)}` },
              "100%": { transform: "scale(1)", boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}` },
            },
          }),
        }}
      >
        {isListening ? <MicOffIcon /> : <MicIcon />}
      </IconButton>

      {/* Live transcript - Highly legible */}
      <Box sx={{ minHeight: 48, textAlign: 'center', width: '100%', px: 2 }}>
        {interimText && (
          <Typography
            variant="h6"
            sx={{
              color: "text.primary",
              fontWeight: 700,
              fontStyle: "italic",
              lineHeight: 1.2,
            }}
          >
            &quot;{interimText}&quot;
          </Typography>
        )}
        {isListening && !interimText && (
          <Typography
            variant="h6"
            sx={{ color: "error.main", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            LISTENING...
          </Typography>
        )}
      </Box>
    </Box>
  );
}
