import { useCallback, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeContext, type ThemeMode } from "../lib/theme";
import { WorkspaceProvider } from "../lib/workspace-provider";

/**
 * Root layout wraps the app in theme context, workspace provider,
 * and safe area handling. Dark mode by default.
 */
export default function RootLayout() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const themeValue = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <SafeAreaProvider>
        <WorkspaceProvider>
          <StatusBar style={mode === "dark" ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: mode === "dark" ? "#0c1222" : "#f8fafc",
              },
              animation: "fade",
            }}
          />
        </WorkspaceProvider>
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}
