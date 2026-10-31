import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DateRangeIcon from "@mui/icons-material/DateRange";
import { t } from "../../lib/locale";

export type ComparisonPreset =
  | "last_30_vs_prior_30"
  | "this_month_vs_last_month"
  | "this_quarter_vs_last_quarter"
  | "custom";

export interface DateRangeComparisonValues {
  primaryStart: string;
  primaryEnd: string;
  compareStart: string;
  compareEnd: string;
  preset: ComparisonPreset;
}

interface DateRangeComparisonPickerProps {
  value: DateRangeComparisonValues;
  onChange: (val: DateRangeComparisonValues) => void;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function computePresetDates(preset: ComparisonPreset): Omit<DateRangeComparisonValues, "preset"> {
  const today = new Date();

  if (preset === "last_30_vs_prior_30") {
    const pEnd = new Date(today);
    const pStart = new Date(today);
    pStart.setDate(pStart.getDate() - 29);

    const cStart = new Date(pStart);
    cStart.setDate(cStart.getDate() - 30);
    const cEnd = new Date(pStart);
    cEnd.setDate(cEnd.getDate() - 1);

    return {
      primaryStart: formatDate(pStart),
      primaryEnd: formatDate(pEnd),
      compareStart: formatDate(cStart),
      compareEnd: formatDate(cEnd),
    };
  }

  if (preset === "this_month_vs_last_month") {
    const y = today.getFullYear();
    const m = today.getMonth();

    const pStart = new Date(y, m, 1);
    const pEnd = new Date(y, m + 1, 0);

    const cStart = new Date(y, m - 1, 1);
    const cEnd = new Date(y, m, 0);

    return {
      primaryStart: formatDate(pStart),
      primaryEnd: formatDate(pEnd),
      compareStart: formatDate(cStart),
      compareEnd: formatDate(cEnd),
    };
  }

  if (preset === "this_quarter_vs_last_quarter") {
    const y = today.getFullYear();
    const currentQ = Math.floor(today.getMonth() / 3);

    const pStart = new Date(y, currentQ * 3, 1);
    const pEnd = new Date(y, (currentQ + 1) * 3, 0);

    const prevQYear = currentQ === 0 ? y - 1 : y;
    const prevQ = currentQ === 0 ? 3 : currentQ - 1;

    const cStart = new Date(prevQYear, prevQ * 3, 1);
    const cEnd = new Date(prevQYear, (prevQ + 1) * 3, 0);

    return {
      primaryStart: formatDate(pStart),
      primaryEnd: formatDate(pEnd),
      compareStart: formatDate(cStart),
      compareEnd: formatDate(cEnd),
    };
  }

  // fallback to last 30
  const pEnd = new Date(today);
  const pStart = new Date(today);
  pStart.setDate(pStart.getDate() - 29);
  const cStart = new Date(pStart);
  cStart.setDate(cStart.getDate() - 30);
  const cEnd = new Date(pStart);
  cEnd.setDate(cEnd.getDate() - 1);

  return {
    primaryStart: formatDate(pStart),
    primaryEnd: formatDate(pEnd),
    compareStart: formatDate(cStart),
    compareEnd: formatDate(cEnd),
  };
}

export default function DateRangeComparisonPicker({
  value,
  onChange,
}: DateRangeComparisonPickerProps) {
  const [preset, setPreset] = useState<ComparisonPreset>(value.preset);
  const [primaryStart, setPrimaryStart] = useState(value.primaryStart);
  const [primaryEnd, setPrimaryEnd] = useState(value.primaryEnd);
  const [compareStart, setCompareStart] = useState(value.compareStart);
  const [compareEnd, setCompareEnd] = useState(value.compareEnd);

  const handleSelectPreset = (p: ComparisonPreset) => {
    setPreset(p);
    if (p !== "custom") {
      const dates = computePresetDates(p);
      setPrimaryStart(dates.primaryStart);
      setPrimaryEnd(dates.primaryEnd);
      setCompareStart(dates.compareStart);
      setCompareEnd(dates.compareEnd);
      onChange({ ...dates, preset: p });
    }
  };

  const handleCustomApply = () => {
    onChange({
      primaryStart,
      primaryEnd,
      compareStart,
      compareEnd,
      preset: "custom",
    });
  };

  useEffect(() => {
    setPrimaryStart(value.primaryStart);
    setPrimaryEnd(value.primaryEnd);
    setCompareStart(value.compareStart);
    setCompareEnd(value.compareEnd);
    setPreset(value.preset);
  }, [value]);

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      {/* Preset Buttons Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DateRangeIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t("Comparison Date Range")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={t("Last 30 Days vs Prior 30")}
            size="small"
            clickable
            color={preset === "last_30_vs_prior_30" ? "primary" : "default"}
            onClick={() => handleSelectPreset("last_30_vs_prior_30")}
          />
          <Chip
            label={t("This Month vs Last Month")}
            size="small"
            clickable
            color={preset === "this_month_vs_last_month" ? "primary" : "default"}
            onClick={() => handleSelectPreset("this_month_vs_last_month")}
          />
          <Chip
            label={t("This Quarter vs Last Quarter")}
            size="small"
            clickable
            color={preset === "this_quarter_vs_last_quarter" ? "primary" : "default"}
            onClick={() => handleSelectPreset("this_quarter_vs_last_quarter")}
          />
          <Chip
            label={t("Custom Range")}
            size="small"
            clickable
            color={preset === "custom" ? "primary" : "default"}
            onClick={() => handleSelectPreset("custom")}
          />
        </Box>
      </Box>

      {/* Date Pickers Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr auto" },
          gap: 2,
          alignItems: "center",
        }}
      >
        {/* Primary Period */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "primary.main",
            backgroundColor: "action.hover",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", display: "block", mb: 1 }}>
            {t("PRIMARY PERIOD (TARGET)")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              type="date"
              label={t("From")}
              value={primaryStart}
              onChange={(e) => {
                setPrimaryStart(e.target.value);
                setPreset("custom");
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              size="small"
              type="date"
              label={t("To")}
              value={primaryEnd}
              onChange={(e) => {
                setPrimaryEnd(e.target.value);
                setPreset("custom");
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Box>
        </Box>

        {/* Separator Icon */}
        <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
          <CompareArrowsIcon color="action" />
        </Box>

        {/* Comparison Period */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
            {t("COMPARISON PERIOD (BENCHMARK)")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              type="date"
              label={t("From")}
              value={compareStart}
              onChange={(e) => {
                setCompareStart(e.target.value);
                setPreset("custom");
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              size="small"
              type="date"
              label={t("To")}
              value={compareEnd}
              onChange={(e) => {
                setCompareEnd(e.target.value);
                setPreset("custom");
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Box>
        </Box>

        {/* Apply Button (shown for custom) */}
        {preset === "custom" && (
          <Button
            variant="contained"
            size="medium"
            onClick={handleCustomApply}
            sx={{ height: 40 }}
          >
            {t("Apply")}</Button>
        )}
      </Box>
    </Paper>
  );
}
