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
import MicNoneOutlined from "@mui/icons-material/MicNoneOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import { useTheme, alpha } from "@mui/material/styles";
import { useAuth } from "@/lib/auth-context";
import { useThemeMode } from "@/lib/theme-context";

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

export default function LoginScreen() {
  const adminAlias = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_ALIAS || "demo-SA";
  const adminEmail = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL || "superadmin@sophiie.com";

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
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const normalizedInput = email.trim();
      const resolvedEmail =
        normalizedInput.toLowerCase() === adminAlias.toLowerCase() ? adminEmail : normalizedInput;

      const success = await login(resolvedEmail, password);
      if (!success) {
        setError("Invalid credentials");
        return;
      }

      const rawUser = localStorage.getItem("user");
      const role = rawUser ? JSON.parse(rawUser)?.role : undefined;
      router.push(role === "admin" ? "/admin-portal" : "/customer-portal");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
      "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" },
      "&:hover fieldset": { borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" },
      "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1.5 },
    },
    "& .MuiInputLabel-root": { color: "text.secondary", fontSize: "0.875rem" },
    "& .MuiInputBase-input": { color: "text.primary", fontSize: "0.875rem", py: 1.5 },
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
      <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
        <IconButton
          onClick={toggleMode}
          size="small"
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          sx={{
            color: "text.secondary",
            bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            width: 36,
            height: 36,
          }}
        >
          {isDark ? <LightModeOutlined sx={{ fontSize: 18 }} /> : <DarkModeOutlined sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>

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
                Sophie Orbit
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

      <Fade in timeout={1000}>
        <Box
          component="form"
          onSubmit={handleSubmit}
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
            gap: 2,
            ...(!isDark && { boxShadow: "0 -4px 32px rgba(0,0,0,0.06)" }),
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ color: "text.primary", fontWeight: 600, fontSize: "1rem", mb: 0.5 }}
          >
            Sign in
          </Typography>

          <TextField
            fullWidth
            label="Email"
            type="text"
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
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      sx={{ color: "text.secondary" }}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={inputSx}
          />

          {error && (
            <Typography variant="body2" sx={{ color: "error.main", fontSize: "0.8rem" }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            disableElevation
            sx={{
              py: 1.4,
              mt: 0.5,
              borderRadius: "12px",
              bgcolor: "primary.main",
              color: isDark ? "#0E0E0E" : "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
              "&:hover": { bgcolor: "primary.dark" },
              "&.Mui-disabled": {
                bgcolor: alpha(primary, 0.35),
                color: isDark ? "rgba(14,14,14,0.5)" : "rgba(255,255,255,0.5)",
              },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: isDark ? "#0E0E0E" : "#FFF" }} /> : "Continue"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/google/login`;
            }}
            startIcon={<GoogleIcon />}
            sx={{
              py: 1.2,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Continue with Google
          </Button>

          <Typography
            variant="body2"
            sx={{ color: "text.secondary", textAlign: "center", fontSize: "0.72rem", mt: 0.5, opacity: 0.7 }}
          >
            Enter any valid account. Admin alias: demo-SA
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
