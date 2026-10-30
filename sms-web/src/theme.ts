import { createTheme, type Theme } from "@mui/material/styles";
import type { ThemeMode } from "./store/themeStore";

export function getAppTheme(mode: ThemeMode): Theme {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#38bdf8" : "#0284c7", // Sky/Blue
        light: isDark ? "#7dd3fc" : "#38bdf8",
        dark: isDark ? "#0369a1" : "#075985",
        contrastText: isDark ? "#0f172a" : "#ffffff",
      },
      secondary: {
        main: "#10b981", // Emerald accent matching worker mobile app
        light: "#34d399",
        dark: "#059669",
        contrastText: "#ffffff",
      },
      background: {
        default: isDark ? "#0b0f19" : "#f8fafc",
        paper: isDark ? "#111827" : "#ffffff",
      },
      text: {
        primary: isDark ? "#f3f4f6" : "#0f172a",
        secondary: isDark ? "#9ca3af" : "#64748b",
      },
      divider: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    },
    typography: {
      fontFamily: [
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
      ].join(","),
      h5: {
        fontWeight: 600,
        letterSpacing: "-0.01em",
      },
      h6: {
        fontWeight: 600,
        letterSpacing: "-0.01em",
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#0f172a" : "#0284c7",
            backgroundImage: "none",
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "none",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow: isDark
              ? "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
          },
        },
      },
    },
  });
}

