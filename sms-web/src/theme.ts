import { createTheme, type Theme } from "@mui/material/styles";
import { enUS as materialEnUS, idID as materialIdID } from "@mui/material/locale";
import { enUS as gridEnUS, idID as gridIdID } from "@mui/x-data-grid/locales";
import type {} from "@mui/x-data-grid/themeAugmentation";
import type { ThemeMode } from "./store/themeStore";
import type { Language } from "./lib/locale";

export function getAppTheme(mode: ThemeMode, language: Language = "id"): Theme {
  const isDark = mode === "dark";
  const border = isDark ? "#263449" : "#e2e8f0";
  const surface = isDark ? "#111c2e" : "#ffffff";
  const mutedSurface = isDark ? "#162338" : "#f8fafc";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#38bdf8" : "#0284c7",
        light: "#7dd3fc",
        dark: isDark ? "#0ea5e9" : "#0369a1",
        contrastText: isDark ? "#0f172a" : "#ffffff",
      },
      secondary: { main: isDark ? "#34d399" : "#059669" },
      background: { default: isDark ? "#0b1423" : "#f8fafc", paper: surface },
      text: {
        primary: isDark ? "#e2e8f0" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#64748b",
      },
      divider: border,
      success: { main: isDark ? "#34d399" : "#15803d" },
      warning: { main: isDark ? "#fbbf24" : "#b45309" },
      error: { main: isDark ? "#fb7185" : "#be123c" },
      info: { main: isDark ? "#38bdf8" : "#0369a1" },
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 14,
      h4: { fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.04em" },
      h5: { fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.035em" },
      h6: { fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em" },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body1: { fontSize: "0.875rem", lineHeight: 1.65 },
      body2: { fontSize: "0.8125rem", lineHeight: 1.6 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { fontVariantNumeric: "tabular-nums" },
          "a, button, input, [tabindex]": { WebkitTapHighlightColor: "transparent" },
          "*:focus-visible": { outline: "2px solid #0284c7", outlineOffset: 3 },
        },
      },
      MuiAppBar: {
        defaultProps: { color: "default", elevation: 0 },
        styleOverrides: {
          root: { backgroundColor: surface, backgroundImage: "none", borderBottom: `1px solid ${border}` },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: "none", boxShadow: "none" } },
      },
      MuiCard: {
        styleOverrides: { root: { borderRadius: 16, border: `1px solid ${border}` } },
      },
      MuiCardContent: {
        styleOverrides: { root: { padding: 24, "&:last-child": { paddingBottom: 24 } } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, minHeight: 40, paddingInline: 16 },
          sizeSmall: { minHeight: 32, paddingInline: 12 },
          outlined: { borderColor: border },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { minWidth: 40, minHeight: 40 }, sizeSmall: { minWidth: 32, minHeight: 32 } },
      },
      MuiTextField: { defaultProps: { size: "small" } },
      MuiFormControl: { defaultProps: { size: "small" } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: surface,
            borderRadius: 10,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: border },
          },
          input: { paddingBlock: 11 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 500 },
          sizeSmall: { height: 26 },
        },
      },
      MuiTabs: {
        defaultProps: { variant: "scrollable", scrollButtons: "auto" },
        styleOverrides: {
          root: { minHeight: 48, borderBottom: `1px solid ${border}` },
          indicator: { height: 3, borderRadius: "3px 3px 0 0" },
        },
      },
      MuiTab: {
        styleOverrides: { root: { minHeight: 48, textTransform: "none", fontSize: "0.8125rem", fontWeight: 500 } },
      },
      MuiTableContainer: {
        styleOverrides: { root: { border: `1px solid ${border}`, borderRadius: 12 } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: border, padding: "14px 16px" },
          head: { backgroundColor: mutedSurface, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, whiteSpace: "nowrap" },
          sizeSmall: { padding: "10px 12px" },
        },
      },
      MuiDataGrid: {
        defaultProps: { rowHeight: 56, columnHeaderHeight: 48, pageSizeOptions: [10, 25, 50, 100] },
        styleOverrides: {
          root: {
            backgroundColor: surface,
            borderColor: border,
            borderRadius: 12,
            "--DataGrid-containerBackground": mutedSurface,
            "--DataGrid-borderColor": border,
          },
          columnHeaderTitle: { fontWeight: 600, fontSize: "0.75rem" },
          cell: { borderColor: border },
          footerContainer: { borderTopColor: border },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 16, border: `1px solid ${border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" } },
      },
      MuiDialogTitle: { styleOverrides: { root: { padding: "24px 24px 16px" } } },
      MuiDialogActions: { styleOverrides: { root: { padding: "16px 24px", borderTop: `1px solid ${border}`, gap: 8 } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: "0.75rem" } } },
      MuiSkeleton: { styleOverrides: { root: { borderRadius: 8 } } },
    },
  }, language === "id" ? materialIdID : materialEnUS, language === "id" ? gridIdID : gridEnUS);
}
