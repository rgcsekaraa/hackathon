"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

/**
 * Email Verification landing page -- processes the UUID token and shows results.
 */
export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [error, setError] = useState(token ? "" : "No verification token provided.");

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/auth/verify-email?token=${token}`);
        if (res.ok) {
          setStatus("success");
          setTimeout(() => router.push("/auth/login"), 3000);
        } else {
          const data = await res.json();
          setStatus("error");
          setError(data.detail || "Verification failed");
        }
      } catch (err) {
        setStatus("error");
        setError("Failed to connect to verification server.");
      }
    };

    verify();
  }, [token, router]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          p: 4,
          bgcolor: "background.paper",
          borderRadius: "8px",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        {status === "loading" && (
          <Box sx={{ py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Verifying your email...</Typography>
            <Typography variant="body2" color="text.secondary">Please wait a moment while we process your request.</Typography>
          </Box>
        )}

        {status === "success" && (
          <Box sx={{ py: 2 }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Email Verified!</Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
              Your account is now fully active. Redirecting you to login...
            </Typography>
            <Button variant="contained" onClick={() => router.push("/auth/login")} fullWidth>
              Go to Login
            </Button>
          </Box>
        )}

        {status === "error" && (
          <Box sx={{ py: 2 }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Verification Failed</Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>{error}</Alert>
            <Button variant="outlined" onClick={() => router.push("/auth/signup")} fullWidth>
              Back to Sign Up
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
