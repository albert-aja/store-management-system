import { useState } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  useAllocate,
  useAllocations,
  useReleaseAllocation,
  useStockUnits,
} from "./hooks";

interface Props {
  salesOrderItemId: string;
  storeId: string;
  variantId: string;
}

export default function AllocationPanel({
  salesOrderItemId,
  storeId,
  variantId,
}: Props) {
  const { data: allocations } = useAllocations(salesOrderItemId);
  const { data: reservedUnits } = useStockUnits({
    storeId,
    variantId,
    availability: "RESERVED",
  });
  const allocate = useAllocate(salesOrderItemId);
  const release = useReleaseAllocation(salesOrderItemId);
  const [stockUnitId, setStockUnitId] = useState("");

  const activeAllocations = (allocations ?? []).filter((a) => !a.releasedAt);
  const candidateUnits = (reservedUnits ?? []).filter(
    (u) =>
      u.reservedForSoItemId === salesOrderItemId &&
      !activeAllocations.some((a) => a.stockUnitId === u.id),
  );

  return (
    <Box sx={{ pl: 2 }}>
      <List dense>
        {activeAllocations.map((a) => (
          <ListItem
            key={a.id}
            secondaryAction={
              <Button size="small" onClick={() => release.mutate(a.id)}>
                Release
              </Button>
            }
          >
            <ListItemText primary={`Stock Unit ${a.stockUnitId.slice(0, 8)}`} />
          </ListItem>
        ))}
      </List>
      {candidateUnits.length > 0 && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            select
            size="small"
            label="Reserved unit"
            sx={{ width: 220 }}
            value={stockUnitId}
            onChange={(e) => setStockUnitId(e.target.value)}
          >
            {candidateUnits.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.manufacturerSerial ?? u.id.slice(0, 8)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            size="small"
            disabled={!stockUnitId}
            onClick={() => {
              allocate.mutate(stockUnitId);
              setStockUnitId("");
            }}
          >
            Allocate
          </Button>
        </Box>
      )}
    </Box>
  );
}
