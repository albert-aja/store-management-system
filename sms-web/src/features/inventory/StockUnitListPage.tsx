import { useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../stores/hooks";
import ReceiveStockUnitDialog from "./ReceiveStockUnitDialog";
import TransferStockUnitDialog from "./TransferStockUnitDialog";
import { useAdjustAvailability, useStockUnits } from "./hooks";
import type { StockAvailability, StockUnit } from "./types";

const AVAILABILITIES: StockAvailability[] = [
  "AVAILABLE",
  "RESERVED",
  "UNAVAILABLE",
];

export default function StockUnitListPage() {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const [availability, setAvailability] = useState<StockAvailability | "">("");
  const { data, isLoading } = useStockUnits({
    storeId: storeId || undefined,
    availability: availability || undefined,
  });
  const canManage = useAuthStore((s) => s.hasPermission("INVENTORY_MANAGE"));
  const adjustAvailability = useAdjustAvailability();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<StockUnit | null>(null);

  const columns: GridColDef<StockUnit>[] = [
    { field: "variantName", headerName: "Variant", flex: 1 },
    { field: "manufacturerSerial", headerName: "Serial", width: 150 },
    { field: "locationType", headerName: "Location", width: 150 },
    { field: "availabilityStatus", headerName: "Availability", width: 130 },
    ...(canManage
      ? [
          {
            field: "actions",
            headerName: "",
            width: 260,
            renderCell: (params: { row: StockUnit }) => (
              <>
                <Button
                  size="small"
                  onClick={() => setTransferTarget(params.row)}
                >
                  Transfer
                </Button>
                {params.row.availabilityStatus !== "UNAVAILABLE" ? (
                  <Button
                    size="small"
                    onClick={() =>
                      adjustAvailability.mutate({
                        id: params.row.id,
                        status: "UNAVAILABLE",
                        reason: window.prompt("Reason?") ?? undefined,
                      })
                    }
                  >
                    Mark Unavailable
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={() =>
                      adjustAvailability.mutate({
                        id: params.row.id,
                        status: "AVAILABLE",
                      })
                    }
                  >
                    Mark Available
                  </Button>
                )}
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">Stock Units</Typography>
        {canManage && (
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Receive Stock Unit
          </Button>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          select
          label="Store"
          size="small"
          sx={{ width: 220 }}
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <MenuItem value="">All Stores</MenuItem>
          {(stores ?? []).map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Availability"
          size="small"
          sx={{ width: 220 }}
          value={availability}
          onChange={(e) =>
            setAvailability(e.target.value as StockAvailability | "")
          }
        >
          <MenuItem value="">All</MenuItem>
          {AVAILABILITIES.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <DataGrid
        rows={data ?? []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        autoHeight
        disableRowSelectionOnClick
      />
      <ReceiveStockUnitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <TransferStockUnitDialog
        open={!!transferTarget}
        stockUnit={transferTarget}
        onClose={() => setTransferTarget(null)}
      />
    </Box>
  );
}
