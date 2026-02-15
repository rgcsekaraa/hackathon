"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "@/components/providers/AuthProvider";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Signup failed");
      }

      login(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          borderRadius: "4px",
          backgroundColor: "background.paper",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        }}
      >
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "4px",
              backgroundColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.8rem",
              color: "white",
              mx: "auto",
              mb: 1.5,
            }}
          >
            S
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
            Join Sophiie Orbit today
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join Sophiie Orbit today
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "4px" }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            variant="outlined"
            size="small"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            margin="dense"
            required
            InputProps={{ sx: { borderRadius: "4px" } }}
          />
          <TextField
            fullWidth
            label="Email Address"
            variant="outlined"
            size="small"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="dense"
            required
            InputProps={{ sx: { borderRadius: "4px" } }}
          />
          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            size="small"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="dense"
            required
            InputProps={{ sx: { borderRadius: "4px" } }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, py: 1.2, fontWeight: 600, borderRadius: "4px", boxShadow: "none" }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Create Account"}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2">
            Already have an account?{" "}
            <Link href="/auth/login" fontWeight={600} underline="hover">
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
