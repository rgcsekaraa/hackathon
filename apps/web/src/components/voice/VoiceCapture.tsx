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
          width: 56,
          height: 56,
          borderRadius: "16px", // M3 FAB/Large Component radius
          backgroundColor: isListening
            ? alpha(theme.palette.error.main, 0.1)
            : alpha(theme.palette.primary.main, 0.1),
          color: isListening ? "error.main" : "primary.main",
          border: "1px solid",
          borderColor: isListening ? alpha(theme.palette.error.main, 0.3) : alpha(theme.palette.primary.main, 0.3),
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          flexShrink: 0,
          "&:hover": {
            backgroundColor: isListening
              ? alpha(theme.palette.error.main, 0.2)
              : alpha(theme.palette.primary.main, 0.2),
          },
          ...(isListening && {
            animation: "micPulse 2s infinite",
            "@keyframes micPulse": {
              "0%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.4)}` },
              "100%": { boxShadow: `0 0 0 12px ${alpha(theme.palette.error.main, 0)}` },
            },
          }),
        }}
      >
        {isListening ? <MicOffIcon sx={{ fontSize: 24 }} /> : <MicIcon sx={{ fontSize: 24 }} />}
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
