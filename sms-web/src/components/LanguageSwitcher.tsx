import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { setLanguage, t, useLanguage } from "../lib/locale";

export default function LanguageSwitcher() {
  const language = useLanguage();

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={language}
      onChange={(_, value: "id" | "en" | null) => {
        if (value) setLanguage(value);
      }}
      aria-label={t("Language", language)}
      sx={{ height: 36, "& .MuiToggleButton-root": { px: 1.25, minWidth: 42 } }}
    >
      <Tooltip title={t("Indonesian", language)}>
        <ToggleButton value="id" aria-label={t("Indonesian", language)}>{t("ID")}</ToggleButton>
      </Tooltip>
      <Tooltip title={t("English", language)}>
        <ToggleButton value="en" aria-label={t("English", language)}>{t("EN")}</ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
