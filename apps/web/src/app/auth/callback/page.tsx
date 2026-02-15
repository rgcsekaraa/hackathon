"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useAuth } from "@/components/providers/AuthProvider";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // login now handles token-only cases by fetching profile automatically
      login(token).then(() => {
        router.push("/dashboard");
      });
    } else {
      router.push("/auth/login?error=oauth_failed");
    }
  }, [searchParams, login, router]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Finalizing authentication...
      </Typography>
    </Box>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
