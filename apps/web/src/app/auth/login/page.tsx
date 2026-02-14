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
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      login(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
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
        }}
      >
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "4px",
              backgroundColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "white",
              mx: "auto",
              mb: 2,
            }}
          >
            S
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your account to continue
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
            label="Email Address"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            InputProps={{ sx: { borderRadius: "4px" } }}
          />
          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            InputProps={{ sx: { borderRadius: "4px" } }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Link href="/auth/forgot-password" variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 600, color: "primary.main", textDecoration: "none" }}>
              Forgot Password?
            </Link>
          </Box>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 1, py: 1.2, fontWeight: 600, borderRadius: "4px", boxShadow: "none" }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Sign In"}
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.disabled" sx={{ px: 1, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/auth/google/login`}
            sx={{
              py: 1.5,
              borderRadius: "4px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "1rem",
              color: "text.primary",
              borderColor: "divider",
              bgcolor: "background.paper",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              boxShadow: "none",
              "&:hover": {
                borderColor: "text.primary",
                bgcolor: "action.hover",
                boxShadow: "none",
              },
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.71-1.58 2.69-3.91 2.69-6.62z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33C2.43 15.89 5.5 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.95a8.99 8.99 0 0 0 0 8.08l3.01-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.45C13.46.99 11.42 0 9 0 5.5 0 2.43 2.11.95 5.12l3.01 2.33c.71-2.13 2.7-3.71 5.04-3.71z"
              />
            </svg>
            Continue with Google
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" fontWeight={600} underline="hover">
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
