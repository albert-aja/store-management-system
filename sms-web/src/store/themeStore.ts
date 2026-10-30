import { create } from "zustand";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const getInitialMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem("sms_theme_mode");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // fallback
  }
  return "light";
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getInitialMode(),
  toggleTheme: () =>
    set((state) => {
      const nextMode = state.mode === "light" ? "dark" : "light";
      try {
        localStorage.setItem("sms_theme_mode", nextMode);
      } catch {
        // ignore
      }
      return { mode: nextMode };
    }),
  setMode: (mode) => {
    try {
      localStorage.setItem("sms_theme_mode", mode);
    } catch {
      // ignore
    }
    set({ mode });
  },
}));

