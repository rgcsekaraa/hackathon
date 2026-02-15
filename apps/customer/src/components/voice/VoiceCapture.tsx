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
    <Box sx={{ width: "100%", textAlign: "center", py: 2 }}>
      {/* Immersive HUD Overlay during listening */}
      {isListening && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            backgroundColor: alpha(theme.palette.background.default, 0.9),
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.3s ease-out",
            "@keyframes fadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        >
          {/* Central Orbit Pulse */}
          <Box
            sx={{
              position: "relative",
              width: 240,
              height: 240,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.4 - i * 0.1)}`,
                  animation: `orbitPulse 2s infinite ease-out ${i * 0.5}s`,
                  "@keyframes orbitPulse": {
                    "0%": { transform: "scale(0.8)", opacity: 1 },
                    "100%": { transform: "scale(1.4)", opacity: 0 },
                  },
                }}
              />
            ))}
            <IconButton
              onClick={handleMicToggle}
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                color: "white",
                boxShadow: `0 0 50px ${alpha(theme.palette.primary.main, 0.6)}`,
                "& .MuiSvgIcon-root": { fontSize: 48 },
              }}
            >
              <MicOffIcon />
            </IconButton>
          </Box>

          <Box sx={{ mt: 8, px: 4, width: "100%", maxWidth: 600 }}>
            <Typography
              variant="h4"
              sx={{
                color: "text.primary",
                fontWeight: 800,
                mb: 2,
                opacity: interimText ? 1 : 0.6,
                letterSpacing: "-0.02em",
              }}
            >
              {interimText || "I'm Listening..."}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.1em" }}
            >
              SOPHIIE ORBIT
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 48,
              color: "text.disabled",
              fontWeight: 700,
            }}
          >
            TAP TO CONFIRM
          </Typography>
        </Box>
      )}

      {/* Main Action Hub Trigger (when not listening) */}
      {!isListening && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <IconButton
            onClick={handleMicToggle}
            sx={{
              width: 80,
              height: 80,
              borderRadius: "24px",
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, 0.2),
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              "& .MuiSvgIcon-root": { fontSize: 32 },
              "&:hover": {
                transform: "translateY(-4px)",
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                borderColor: "primary.main",
                boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
            }}
          >
            <MicIcon />
          </IconButton>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 800, letterSpacing: "0.05em" }}
          >
            START COMMAND
          </Typography>
        </Box>
      )}
    </Box>
  );
}
