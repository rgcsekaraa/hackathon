"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  login: (token: string, user?: User) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else if (storedToken) {
      // Token exists but no user, fetch it
      setToken(storedToken);
      fetchProfile(storedToken);
    }
    setIsLoading(false);
  }, []);

  const fetchProfile = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  }, []);

  const login = useCallback(async (newToken: string, newUser?: User) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    if (newUser) {
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      await fetchProfile(newToken);
    }
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Login failed");
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/");
  }, [router]);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
