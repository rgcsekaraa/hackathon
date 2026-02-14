"use client";

import { useCallback, useState, type KeyboardEvent } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";

/**
 * Text input for typing workspace commands.
 * Submits on Enter or click of the send button.
 */
export function TextInput() {
  const { sendUtterance } = useWorkspace();
  const [text, setText] = useState("");

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
    <TextField
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Type a command... e.g. 'Add Smith reno tomorrow morning'"
      variant="outlined"
      size="small"
      fullWidth
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleSubmit}
                disabled={!text.trim()}
                color="primary"
                size="small"
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            borderRadius: 3,
            backgroundColor: "background.paper",
          },
        },
      }}
    />
  );
}
