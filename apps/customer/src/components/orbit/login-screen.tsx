"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Fade from "@mui/material/Fade";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import MicNoneOutlined from "@mui/icons-material/MicNoneOutlined";
import { useTheme, alpha } from "@mui/material/styles";
import { useThemeMode } from "@/lib/theme-context";

/* ---- Animated orbit rings ---- */
function OrbitRings({ color }: { color: string }) {
  const rings = [80, 124, 168, 210];
  return (
    <Box
      sx={{
        position: "relative",
        width: 210,
        height: 210,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {rings.map((size, i) => (
        <Box
          key={size}
          sx={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            border: `1.5px solid ${alpha(color, 0.12 + i * 0.04)}`,
            animation: `spin${i % 2 === 0 ? "" : "Reverse"} ${18 + i * 6}s linear infinite`,
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
            "@keyframes spinReverse": {
              "0%": { transform: "rotate(360deg)" },
              "100%": { transform: "rotate(0deg)" },
            },
          }}
        >
          {/* Dot on ring */}
          <Box
            sx={{
              position: "absolute",
              top: -3,
              left: "50%",
              ml: "-3px",
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: alpha(color, 0.3 + i * 0.12),
            }}
          />
        </Box>
      ))}
      {/* Centre icon */}
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          bgcolor: alpha(color, 0.12),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <MicNoneOutlined sx={{ color, fontSize: 22 }} />
      </Box>
    </Box>
  );
}

/* ---- Google "G" logo SVG ---- */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginScreen() {
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for OAuth error from URL params (e.g. rejected by backend)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError && !error) {
      if (urlError === "account_not_supported") {
        setError("Account not supported. Please contact support to get access.");
      } else if (urlError === "oauth_failed") {
        setError("Sign-in failed. Please try again.");
      }
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError("");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${apiUrl}/auth/google/login`;
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Theme toggle - top right */}
      <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
        <IconButton
          onClick={toggleMode}
          size="small"
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          sx={{ color: "text.secondary", bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", width: 36, height: 36 }}
        >
          {isDark ? <LightModeOutlined sx={{ fontSize: 18 }} /> : <DarkModeOutlined sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>

      {/* ---- Hero area (top 55%) ---- */}
      <Box
        sx={{
          flex: "1 1 55%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          px: 3,
          pt: { xs: 8, sm: 6 },
          pb: 2,
          minHeight: { xs: 320, sm: 380 },
        }}
      >
        <Fade in timeout={800}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
            <OrbitRings color={primary} />

            <Box sx={{ textAlign: "center", mt: -1 }}>
              <Typography
                variant="h4"
                sx={{
                  color: "text.primary",
                  fontWeight: 600,
                  fontSize: { xs: "1.6rem", sm: "2rem" },
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                Sophiie Orbit
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  mt: 1,
                  fontSize: { xs: "0.85rem", sm: "0.9rem" },
                  maxWidth: 260,
                  mx: "auto",
                  lineHeight: 1.5,
                }}
              >
                Your voice-first workspace.
                <br />
                Appointments, calendar, and enquiries.
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Box>

      {/* ---- Bottom sheet ---- */}
      <Fade in timeout={1000}>
        <Box
          sx={{
            flex: "0 0 auto",
            bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "#FFFFFF",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            borderRadius: { xs: "24px 24px 0 0", sm: "24px 24px 0 0" },
            px: { xs: 3, sm: 4 },
            pt: { xs: 3.5, sm: 4 },
            pb: { xs: 4, sm: 5 },
            maxWidth: { sm: 420 },
            mx: "auto",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            alignItems: "center",
            ...(!isDark && {
              boxShadow: "0 -4px 32px rgba(0,0,0,0.06)",
            }),
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: "text.primary",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Get started
          </Typography>

          {error && (
            <Box
              sx={{
                width: "100%",
                bgcolor: isDark ? "rgba(244,67,54,0.08)" : "rgba(244,67,54,0.06)",
                border: `1px solid ${isDark ? "rgba(244,67,54,0.2)" : "rgba(244,67,54,0.15)"}`,
                borderRadius: "12px",
                px: 2,
                py: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ color: "error.main", fontSize: "0.82rem", lineHeight: 1.5 }}>
                {error}
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant="outlined"
            disabled={loading}
            onClick={handleGoogleSignIn}
            startIcon={loading ? null : <GoogleIcon />}
            sx={{
              py: 1.4,
              borderRadius: "12px",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
              color: "text.primary",
              fontWeight: 500,
              fontSize: "0.875rem",
              textTransform: "none",
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
              "&:hover": {
                borderColor: isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.24)",
                bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.02)",
              },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "text.secondary" }} /> : "Sign in with Google"}
          </Button>

          <Typography
            variant="caption"
            sx={{
              color: "text.disabled",
              textAlign: "center",
              fontSize: "0.72rem",
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            Only accounts registered by your administrator can sign in.
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
