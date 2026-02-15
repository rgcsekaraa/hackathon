"use client";

import { useAuth as useRealAuth } from "@/components/providers/AuthProvider";
import { ReactNode, useMemo } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  // The main AuthProvider is at the root level.
  return <>{children}</>;
}

export function useAuth() {
  const { user, token, signOut } = useRealAuth();
  
  return useMemo(() => ({
    isLoggedIn: !!token,
    user: user ? { name: user.full_name || user.email, email: user.email } : null,
    login: async () => true, // Login happens in the actual login page via useRealAuth
    logout: signOut
  }), [user, token, signOut]);
}
