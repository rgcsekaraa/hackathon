"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import type { PaletteMode } from "@mui/material";
import { buildTheme } from "./theme";

interface ThemeContextType {
  mode: PaletteMode;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeContextType>({
  mode: "dark",
  toggleMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>("dark");

  useEffect(() => {
    const saved = window.localStorage?.getItem("sophie-orbit-theme");
    if (saved === "light" || saved === "dark") {
      setMode(saved);
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage?.setItem("sophie-orbit-theme", next);
      } catch {}
      return next;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
