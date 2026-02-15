"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * Root page — redirects to login or customer portal based on auth state.
 */
export default function RootPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(token ? "/customer-portal" : "/auth/login");
    }
  }, [token, isLoading, router]);

  return null;
}
