"use client";

import { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/SendOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToyOutlined";
import PersonIcon from "@mui/icons-material/PersonOutlined";
import CloseIcon from "@mui/icons-material/CloseOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import { useAuth } from "@/context/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatSidebarProps {
  onClose: () => void;
}

export function AIChatSidebar({ onClose }: AIChatSidebarProps) {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm Sophiie. How can I help you manage your workspace today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { token } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      // In a real app, this would call a dedicated chat endpoint.
      // For the hackathon, we can reuse the utterance logic or a mock response.
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/ws/session`, {
          // This is a placeholder since the backend uses WebSockets for utterance.
          // Alternatively, we could implement a simple HTTP chat endpoint.
      });

      // Mocking AI response for now to show UI flow
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: `I've analyzed your request: "${userMsg}". I can help you organize those tasks in your workspace.` }]);
        setLoading(false);
      }, 1000);

    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now." }]);
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: 350,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
        <SmartToyIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
          AI Assistant
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: "12px",
                borderTopRightRadius: msg.role === "user" ? "2px" : "12px",
                borderTopLeftRadius: msg.role === "assistant" ? "2px" : "12px",
                bgcolor: msg.role === "user" ? "primary.main" : alpha(theme.palette.action.hover, 0.8),
                color: msg.role === "user" ? "white" : "text.primary",
              }}
            >
              <Typography variant="body2">{msg.content}</Typography>
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, px: 0.5, alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "user" ? "You" : "Sophiie"}
            </Typography>
          </Box>
        ))}
        {loading && (
          <Typography variant="caption" sx={{ fontStyle: "italic", color: "text.disabled", px: 1 }}>
            Sophiie is thinking...
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
          />
          <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || loading}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
