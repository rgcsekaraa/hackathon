"use client";

import { useCallback, useState, type KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import { alpha, useTheme } from "@mui/material/styles";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";

/**
 * Premium command bar input - Redesigned for a high-end production feel.
 * Minimalist borderless aesthetic with deep focus states.
 */
export function TextInput() {
  const { sendUtterance } = useWorkspace();
  const theme = useTheme();
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    sendUtterance(trimmed, "text");
    setText("");
  }, [text, sendUtterance]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 0.5,
        borderRadius: 2,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: isFocused ? "primary.main" : "divider",
        boxShadow: isFocused ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}` : "0 1px 2px rgba(0,0,0,0.05)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        width: "100%",
      }}
    >
      <SearchIcon sx={{ color: "text.disabled", mr: 1.5, fontSize: "1.2rem" }} />
      <InputBase
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Type a command or search... (e.g. 'Add Smith reno tomorrow')"
        sx={{
          fontSize: "0.95rem",
          fontWeight: 500,
          color: "text.primary",
          "& input::placeholder": {
            color: "text.disabled",
            opacity: 1,
          },
        }}
      />
      <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
        <IconButton
          onClick={handleSubmit}
          disabled={!text.trim()}
          size="small"
          sx={{
            borderRadius: 1.5,
            backgroundColor: text.trim() ? alpha(theme.palette.primary.main, 0.08) : "transparent",
            color: text.trim() ? "primary.main" : "text.disabled",
            transition: "all 0.2s",
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
            },
          }}
        >
          <KeyboardReturnIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}
