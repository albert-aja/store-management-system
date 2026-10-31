import { useState } from "react";
import { Alert, Avatar, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { t, translateKnownBackendMessage, useLanguage } from "../lib/locale";

export default function LoginPage() {
  const language = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(translateKnownBackendMessage(error.message));
        return;
      }
      navigate("/", { replace: true });
    } catch (cause) {
      console.error("Management sign-in failed:", cause);
      setError(t("Unable to sign in. Check your connection and try again.", language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 1 }}>
        <LanguageSwitcher />
      </Box>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 448, borderRadius: 2 }} component="form" onSubmit={handleSubmit}>
        <Avatar variant="rounded" sx={{ bgcolor: "primary.main", width: 48, height: 48, borderRadius: 1.5, mb: 3 }}>
          <StorefrontIcon />
        </Avatar>
        <Typography variant="caption" color="primary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
          {t("SMS WORKSPACE")}
        </Typography>
        <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
          {t("Welcome back", language)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t("Sign in to manage your stores, teams, and operations.", language)}</Typography>
        <Stack spacing={2.5}>
        <TextField
          label={t("Email", language)}
          type="email"
          fullWidth
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label={t("Password", language)}
          type="password"
          fullWidth
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <Alert severity="error">{error}</Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ minHeight: 44 }}
          disabled={submitting}
        >
          {t(submitting ? "Signing in..." : "Sign in", language)}
        </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>{t("Staff access only. Contact your administrator for an account.", language)}</Typography>
      </Paper>
    </Box>
  );
}
