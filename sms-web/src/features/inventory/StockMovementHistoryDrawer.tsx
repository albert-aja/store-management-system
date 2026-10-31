import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "./api";
import type { StockUnit } from "./types";
import { formatDate , localizeDisplayCode, t} from "../../lib/locale";

interface StockMovementHistoryDrawerProps {
  stockUnit: StockUnit | null;
  open: boolean;
  onClose: () => void;
}

export default function StockMovementHistoryDrawer({
  stockUnit,
  open,
  onClose,
}: StockMovementHistoryDrawerProps) {
  const theme = useTheme();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock-movements", stockUnit?.id],
    queryFn: () => (stockUnit ? inventoryApi.movements(stockUnit.id) : []),
    enabled: !!stockUnit && open,
  });

  if (!stockUnit) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 460 },
            p: 3,
            backgroundColor: theme.palette.background.paper,
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("Stock Movement Ledger")}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label={t("close")}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Serial & Variant Details */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.02)",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {t("Serial Number")}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }}>
          {stockUnit.manufacturerSerial ?? "Non-serialized unit"}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {t("Variant")}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          {stockUnit.variantName}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Chip
            label={localizeDisplayCode(stockUnit.availabilityStatus)}
            size="small"
            color={
              stockUnit.availabilityStatus === "AVAILABLE"
                ? "success"
                : stockUnit.availabilityStatus === "RESERVED"
                ? "warning"
                : "error"
            }
          />
          <Chip label={stockUnit.locationType} size="small" variant="outlined" />
        </Box>
      </Paper>

      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        {t("Immutable Physical Audit Trail (")}{movements.length}{" "}
        {t(movements.length === 1 ? "event" : "events")})
      </Typography>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : movements.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {t("No movement ledger entries recorded yet.")}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {movements.map((m, idx) => (
            <Paper
              key={m.id || idx}
              variant="outlined"
              sx={{
                p: 2,
                position: "relative",
                borderLeft: `4px solid ${theme.palette.primary.main}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Chip
                  label={m.movementType}
                  size="small"
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    height: 22,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(new Date(m.occurredAt), undefined, { dateStyle: "medium", timeStyle: "short" })}
                </Typography>
              </Box>

              {/* Location Transition */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  my: 1,
                  fontSize: "0.85rem",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {m.fromLocationType ?? "ORIGIN"}
                </Typography>
                <ArrowForwardIcon fontSize="inherit" color="action" />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "primary.main" }}
                >
                  {m.toLocationType ?? "DESTINATION"}
                </Typography>
              </Box>

              {m.referenceType && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {t("Ref:")} {m.referenceType}{" "}
                  {m.referenceId ? `(${m.referenceId})` : ""}
                </Typography>
              )}

              {m.notes && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    mt: 0.5,
                    fontStyle: "italic",
                  }}
                >
                  "{m.notes}"
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
        {t("Physical stock ledger is append-only and cannot be altered.")}
      </Typography>
    </Drawer>
  );
}
