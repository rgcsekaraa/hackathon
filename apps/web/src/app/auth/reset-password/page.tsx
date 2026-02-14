"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";

/**
 * Reset Password page -- validates the token from the URL and allows password update.
 */
export default function ResetPasswordPage() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ type: "error", text: "No reset token found. Please check your link." });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Password reset successfully! Redirecting to login..." });
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        setMessage({ type: "error", text: data.detail || "Failed to reset password" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to connect to server" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.mode === "dark" ? "#020617" : "#f8fafc",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "background.paper",
          p: 4,
          borderRadius: "8px",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Create New Password
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
          Please enter your new password below.
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3, borderRadius: "4px" }}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="New Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!token || loading}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            variant="outlined"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={!token || loading}
            sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={!token || loading}
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
          </Button>
        </form>
      </Box>
    </Box>
  );
}
