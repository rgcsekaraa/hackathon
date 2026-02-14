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
    background: "#020617", // Deep Slate
    surface: "#0f172a", // Slate 900
    surfaceHover: "#1e293b", // Slate 800
    primary: "#6366f1", // Indigo 500
    primaryLight: "#818cf8", // Indigo 400
    secondary: "#a855f7", // Purple 500
    text: "#f8fafc", // Slate 50
    textSecondary: "#94a3b8", // Slate 400
    border: "rgba(255, 255, 255, 0.08)",
    success: "#10b981", // Emerald 500
    error: "#ef4444", // Red 500
    warning: "#f59e0b", // Amber 500
    urgent: "#ef4444",
    high: "#f59e0b",
    normal: "#6366f1",
    low: "#94a3b8",
  },
  light: {
    background: "#f8fafc", // Slate 50
    surface: "#ffffff",
    surfaceHover: "#f1f5f9", // Slate 100
    primary: "#4f46e5", // Indigo 600
    primaryLight: "#6366f1", // Indigo 500
    secondary: "#9333ea", // Purple 600
    text: "#0f172a", // Slate 900
    textSecondary: "#64748b", // Slate 500
    border: "rgba(0, 0, 0, 0.08)",
    success: "#059669", // Emerald 600
    error: "#dc2626", // Red 600
    warning: "#d97706", // Amber 600
    urgent: "#dc2626",
    high: "#d97706",
    normal: "#4f46e5",
    low: "#64748b",
  },
} as const;

/**
 * Glassmorphism styles for React Native.
 */
export const GLASS = {
  dark: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
  },
  light: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderColor: "rgba(0, 0, 0, 0.05)",
    borderWidth: 1,
  },
};

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
