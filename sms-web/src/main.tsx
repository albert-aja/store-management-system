import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { CssBaseline, ThemeProvider } from "@mui/material";
import "./index.css";
import App from "./App.tsx";
import { queryClient } from "./lib/queryClient";
import { useThemeStore } from "./store/themeStore";
import { getAppTheme } from "./theme";
import { useLanguage } from "./lib/locale";

export function Root() {
  const mode = useThemeStore((s) => s.mode);
  const language = useLanguage();
  const theme = getAppTheme(mode, language);
  useEffect(() => {
    document.documentElement.lang = language === "id" ? "id-ID" : "en";
  }, [language]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
