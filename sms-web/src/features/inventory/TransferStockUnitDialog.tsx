import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useStores } from "../stores/hooks";
import { useTransferStockUnit } from "./hooks";
import type { StockLocationType, StockUnit } from "./types";
import { t } from "../../lib/locale";

const LOCATIONS: StockLocationType[] = [
  "WAREHOUSE",
  "SHOWROOM",
  "REPAIR_AREA",
  "IN_TRANSIT",
  "AT_CUSTOMER",
  "AT_SUPPLIER",
  "AT_REPAIR_PROVIDER",
  "DISPOSED",
];

interface Props {
  open: boolean;
  stockUnit: StockUnit | null;
  onClose: () => void;
}

export default function TransferStockUnitDialog({
  open,
  stockUnit,
  onClose,
}: Props) {
  const { data: stores } = useStores();
  const [toStoreId, setToStoreId] = useState("");
  const [toLocationType, setToLocationType] =
    useState<StockLocationType>("WAREHOUSE");
  const [notes, setNotes] = useState("");
  const transfer = useTransferStockUnit();

  if (!stockUnit) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("Transfer")} {stockUnit.variantName}</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
      >
        <TextField
          select
          label={t("To Store")}
          fullWidth
          value={toStoreId || stockUnit.currentStoreId}
          onChange={(e) => setToStoreId(e.target.value)}
        >
          {(stores ?? []).map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t("To Location")}
          fullWidth
          value={toLocationType}
          onChange={(e) =>
            setToLocationType(e.target.value as StockLocationType)
          }
        >
          {LOCATIONS.map((loc) => (
            <MenuItem key={loc} value={loc}>
              {loc}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t("Notes")}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button
          variant="contained"
          onClick={() => {
            transfer.mutate(
              {
                id: stockUnit.id,
                toStoreId: toStoreId || stockUnit.currentStoreId,
                toLocationType,
                notes: notes || undefined,
              },
              { onSuccess: () => onClose() },
            );
          }}
        >
          {t("Transfer")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
