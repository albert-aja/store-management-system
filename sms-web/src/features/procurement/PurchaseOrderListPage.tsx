import { useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../stores/hooks";
import {
  useCreatePurchaseOrder,
  usePurchaseOrders,
  useSupplierSearch,
} from "./hooks";
import type { PurchaseOrder, PurchaseOrderStatus } from "./types";

const STATUSES: PurchaseOrderStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "REJECTED",
  "ISSUED",
  "CANCELLED",
];

function NewPurchaseOrderDialog({ onClose }: { onClose: () => void }) {
  const { data: stores } = useStores();
  const { data: suppliers } = useSupplierSearch("");
  const [storeId, setStoreId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const create = useCreatePurchaseOrder();
  const navigate = useNavigate();

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Draft Purchase Order</DialogTitle>
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
          select
          label="Supplier"
          fullWidth
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          {(suppliers ?? [])
            .filter((s) => s.active)
            .map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!storeId || !supplierId}
          onClick={() =>
            create.mutateAsync({ storeId, supplierId }).then((po) => {
              onClose();
              navigate(`/purchase-orders/${po.id}`);
            })
          }
        >
          Create Draft
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PurchaseOrderListPage() {
  const { data: stores } = useStores();
  const { data: suppliers } = useSupplierSearch("");
  const [storeId, setStoreId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState<PurchaseOrderStatus | "">("");
  const { data, isLoading } = usePurchaseOrders({
    storeId: storeId || undefined,
    supplierId: supplierId || undefined,
    status: status || undefined,
  });
  const canManage = useAuthStore((s) => s.hasPermission("PROCUREMENT_MANAGE"));
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns: GridColDef<PurchaseOrder>[] = [
    {
      field: "number",
      headerName: "Number",
      width: 200,
      valueGetter: (_, row) => row.number ?? "(Draft)",
    },
    { field: "supplierName", headerName: "Supplier", flex: 1 },
    { field: "status", headerName: "Status", width: 180 },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: (params: { row: PurchaseOrder }) => (
        <Button
          size="small"
          onClick={() => navigate(`/purchase-orders/${params.row.id}`)}
        >
          Open
        </Button>
      ),
    },
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
        <Typography variant="h5">Purchase Orders</Typography>
        {canManage && (
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            New Draft PO
          </Button>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
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
          label="Supplier"
          size="small"
          sx={{ width: 220 }}
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <MenuItem value="">All Suppliers</MenuItem>
          {(suppliers ?? []).map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          size="small"
          sx={{ width: 220 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as PurchaseOrderStatus | "")}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
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
      {dialogOpen && (
        <NewPurchaseOrderDialog onClose={() => setDialogOpen(false)} />
      )}
    </Box>
  );
}
