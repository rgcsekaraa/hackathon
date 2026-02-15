"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Fade from "@mui/material/Fade";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { useTheme, alpha } from "@mui/material/styles";
import { useAuth } from "@/lib/auth-context";
import { useThemeMode } from "@/lib/theme-context";

/**
 * Animated concentric security rings — admin-specific branding element.
 */
function SecurityRings({ color }: { color: string }) {
  const rings = [72, 112, 152, 192];
  return (
    <Box
      sx={{
        position: "relative",
        width: 192,
        height: 192,
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
            border: `1px solid ${alpha(color, 0.08 + i * 0.04)}`,
            animation: `pulse ${4 + i * 1.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
            "@keyframes pulse": {
              "0%, 100%": { opacity: 0.4, transform: "scale(1)" },
              "50%": { opacity: 1, transform: "scale(1.03)" },
            },
          }}
        />
      ))}
      {/* Inner glowing shield icon */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${alpha(color, 0.15)}, ${alpha(color, 0.05)})`,
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          border: `1px solid ${alpha(color, 0.12)}`,
          boxShadow: `0 0 32px ${alpha(color, 0.1)}`,
        }}
      >
        <ShieldOutlined sx={{ color, fontSize: 26 }} />
      </Box>
    </Box>
  );
}

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { toggleMode } = useThemeMode();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const success = await login(email.trim(), password);
      if (!success) {
        setError("Invalid credentials.");
        return;
      }
      router.push("/");
    } catch {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
      "& fieldset": {
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      },
      "&:hover fieldset": {
        borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)",
      },
      "&.Mui-focused fieldset": {
        borderColor: primary,
        borderWidth: 1.5,
      },
    },
    "& .MuiInputLabel-root": {
      color: "text.secondary",
      fontSize: "0.85rem",
    },
    "& .MuiInputBase-input": {
      color: "text.primary",
      fontSize: "0.85rem",
      py: 1.5,
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid background */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: isDark ? 0.03 : 0.02,
          backgroundImage:
            "linear-gradient(rgba(128,128,128,1) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Theme toggle */}
      <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <IconButton
          onClick={toggleMode}
          size="small"
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          sx={{
            color: "text.secondary",
            bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            width: 36,
            height: 36,
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            },
          }}
        >
          {isDark ? (
            <LightModeOutlined sx={{ fontSize: 18 }} />
          ) : (
            <DarkModeOutlined sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Box>

      {/* Main card */}
      <Fade in timeout={600}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 400,
            mx: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          {/* Branding */}
          <SecurityRings color={primary} />

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                color: "text.primary",
                fontWeight: 700,
                fontSize: "1.5rem",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
              }}
            >
              Sophiie Space
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.75,
                fontSize: "0.8rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Admin Console
            </Typography>
          </Box>

          {/* Form card */}
          <Box
            sx={{
              width: "100%",
              bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "#FFFFFF",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              borderRadius: "20px",
              px: 3,
              py: 3.5,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              ...(!isDark && {
                boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
              }),
            }}
          >
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              variant="outlined"
              size="small"
              sx={inputSx}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: "text.secondary" }}
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 18 }} />
                      ) : (
                        <Visibility sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {error && (
              <Typography
                variant="body2"
                sx={{
                  color: "error.main",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              disableElevation
              startIcon={
                loading ? null : <LockOutlined sx={{ fontSize: 16 }} />
              }
              sx={{
                py: 1.3,
                mt: 0.5,
                borderRadius: "12px",
                bgcolor: "primary.main",
                color: isDark ? "#0E0E0E" : "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.85rem",
                textTransform: "none",
                letterSpacing: "0.02em",
                "&:hover": { bgcolor: "primary.dark" },
                "&.Mui-disabled": {
                  bgcolor: alpha(primary, 0.35),
                  color: isDark
                    ? "rgba(14,14,14,0.5)"
                    : "rgba(255,255,255,0.5)",
                },
              }}
            >
              {loading ? (
                <CircularProgress
                  size={20}
                  sx={{ color: isDark ? "#0E0E0E" : "#FFF" }}
                />
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>

          {/* Credential hint */}
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                fontSize: "0.68rem",
                letterSpacing: "0.02em",
              }}
            >
              Demo: <code>superadmin@sophiie.com</code> / <code>d3m0-p@s5</code>
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
}
