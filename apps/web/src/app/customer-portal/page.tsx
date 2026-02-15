"use client";

import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import DashboardShell from "@/components/orbit/dashboard-shell";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function PortalContent() {
  return <DashboardShell />;
}

export default function CustomerPortalPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/auth/login");
    }
  }, [token, isLoading, router]);

  if (isLoading || !token) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: 'background.default' }}>
        <Typography variant="h6" color="text.secondary">Authenticating...</Typography>
      </Box>
    );
  }

  return (
    <WorkspaceProvider>
      <PortalContent />
    </WorkspaceProvider>
  );
}
