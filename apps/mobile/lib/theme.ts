import { createContext, useContext } from "react";
import { StyleSheet } from "react-native";

export type ThemeMode = "dark" | "light";

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  toggleTheme: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

/**
 * Color palette for both themes. Matches the MUI theme from the web dashboard.
 */
export const COLORS = {
  dark: {
    background: "#0c1222",
    surface: "#131b2e",
    surfaceHover: "#1a2440",
    primary: "#818cf8",
    primaryLight: "#a5b4fc",
    secondary: "#38bdf8",
    text: "#f1f5f9",
    textSecondary: "#94a3b8",
    border: "rgba(255, 255, 255, 0.08)",
    success: "#34d399",
    error: "#f87171",
    warning: "#fbbf24",
    urgent: "#ef4444",
    high: "#f59e0b",
    normal: "#6366f1",
    low: "#94a3b8",
  },
  light: {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceHover: "#f1f5f9",
    primary: "#4f46e5",
    primaryLight: "#818cf8",
    secondary: "#0ea5e9",
    text: "#0f172a",
    textSecondary: "#475569",
    border: "rgba(0, 0, 0, 0.08)",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    urgent: "#ef4444",
    high: "#f59e0b",
    normal: "#6366f1",
    low: "#94a3b8",
  },
} as const;

export function useColors() {
  const { mode } = useThemeMode();
  return COLORS[mode];
}

/**
 * Design system constants for the "Sharp Pro" look.
 */
export const SHAPE = {
  borderRadius: 4,
  borderWidth: 1,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/**
 * Shared text styles.
 */
export const typography = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  button: { fontSize: 14, fontWeight: "600" },
});
