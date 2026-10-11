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
import { useProductSearch, useVariants } from "../products/hooks";
import { useStores } from "../stores/hooks";
import { useReceiveStockUnit } from "./hooks";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReceiveStockUnitDialog({ open, onClose }: Props) {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const { data: products } = useProductSearch(productQuery);
  const [productId, setProductId] = useState("");
  const { data: variants } = useVariants(productId || null);
  const [variantId, setVariantId] = useState("");
  const [manufacturerSerial, setManufacturerSerial] = useState("");
  const [notes, setNotes] = useState("");
  const receive = useReceiveStockUnit();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Receive Stock Unit</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
      >
        <TextField
          select
          label="Store"
          fullWidth
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          {(stores ?? []).map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search product"
          fullWidth
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
        />
        <TextField
          select
          label="Product"
          fullWidth
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setVariantId("");
          }}
        >
          {(products ?? []).map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Variant"
          fullWidth
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          disabled={!productId}
        >
          {(variants ?? []).map((v) => (
            <MenuItem key={v.id} value={v.id}>
              {v.variantName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Manufacturer serial (optional)"
          fullWidth
          value={manufacturerSerial}
          onChange={(e) => setManufacturerSerial(e.target.value)}
        />
        <TextField
          label="Notes"
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!storeId || !variantId}
          onClick={() => {
            receive.mutate(
              {
                productVariantId: variantId,
                storeId,
                manufacturerSerial: manufacturerSerial || undefined,
                notes: notes || undefined,
              },
              { onSuccess: () => onClose() },
            );
          }}
        >
          Receive
        </Button>
      </DialogActions>
    </Dialog>
  );
}
