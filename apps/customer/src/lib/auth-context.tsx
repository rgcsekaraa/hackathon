"use client";

import { useAuth as useRealAuth } from "@/components/providers/AuthProvider";
import { ReactNode, useMemo } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  // The main AuthProvider is at the root level.
  return <>{children}</>;
}

export function useAuth() {
  const { user, token, signOut, login: setSession } = useRealAuth();
  
  return useMemo(() => ({
    isLoggedIn: !!token,
    token,
    user: user ? { name: user.full_name || user.email, email: user.email, role: user.role } : null,
    login: async (...args: unknown[]) => {
      // login(email, password) path used by UI forms
      if (typeof args[0] === "string" && typeof args[1] === "string" && args.length === 2) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: args[0], password: args[1] }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          await setSession(data.access_token, data.user);
          return true;
        } catch {
          return false;
        }
      }

      // login(token, user?) path used by OAuth callback/signup
      if (typeof args[0] === "string") {
        await setSession(args[0], (args[1] as any) || undefined);
        return true;
      }

      return false;
    },
    logout: signOut
  }), [user, token, signOut, setSession]);
}
