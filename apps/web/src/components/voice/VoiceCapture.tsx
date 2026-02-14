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
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
      {/* Mic button */}
      <IconButton
        onClick={handleMicToggle}
        sx={{
          width: 52,
          height: 52,
          backgroundColor: isListening
            ? alpha(theme.palette.error.main, 0.15)
            : alpha(theme.palette.primary.main, 0.1),
          color: isListening ? "error.main" : "primary.main",
          border: 2,
          borderColor: isListening ? "error.main" : "primary.main",
          transition: "all 0.2s ease",
          flexShrink: 0,
          "&:hover": {
            backgroundColor: isListening
              ? alpha(theme.palette.error.main, 0.25)
              : alpha(theme.palette.primary.main, 0.2),
            transform: "scale(1.05)",
          },
          ...(isListening && {
            animation: "micPulse 1.5s ease-in-out infinite",
            "@keyframes micPulse": {
              "0%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.4)}` },
              "70%": { boxShadow: `0 0 0 12px ${alpha(theme.palette.error.main, 0)}` },
              "100%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}` },
            },
          }),
        }}
      >
        {isListening ? <MicOffIcon /> : <MicIcon />}
      </IconButton>

      {/* Live transcript */}
      {interimText && (
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontStyle: "italic",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {interimText}
        </Typography>
      )}
      {isListening && !interimText && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontStyle: "italic" }}
        >
          Listening...
        </Typography>
      )}
    </Box>
  );
}
