import { useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../stores/hooks";
import NewSalesOrderDialog from "./NewSalesOrderDialog";
import { useSalesOrders } from "./hooks";
import type { SalesOrder, SalesOrderStatus } from "./types";

const STATUSES: SalesOrderStatus[] = [
  "DRAFT",
  "PENDING_PRICE_APPROVAL",
  "REJECTED",
  "RELEASED",
  "SURVEY_REJECTED",
  "CONFIRMED",
  "CANCELLED",
];

export default function SalesOrderListPage() {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState<SalesOrderStatus | "">("");
  const { data, isLoading } = useSalesOrders({
    storeId: storeId || undefined,
    status: status || undefined,
  });
  const canManage = useAuthStore((s) => s.hasPermission("SALES_ORDER_MANAGE"));
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns: GridColDef<SalesOrder>[] = [
    {
      field: "number",
      headerName: "Number",
      width: 200,
      valueGetter: (_, row) => row.number ?? "(Draft)",
    },
    { field: "customerName", headerName: "Customer", flex: 1 },
    { field: "status", headerName: "Status", width: 180 },
    {
      field: "requiresPriceApproval",
      headerName: "Negotiated",
      width: 110,
      type: "boolean",
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: (params: { row: SalesOrder }) => (
        <Button
          size="small"
          onClick={() => navigate(`/sales-orders/${params.row.id}`)}
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
        <Typography variant="h5">Sales Orders</Typography>
        {canManage && (
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            New Draft SO
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
          {(stores ?? []).map((store) => (
            <MenuItem key={store.id} value={store.id}>
              {store.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          size="small"
          sx={{ width: 220 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as SalesOrderStatus | "")}
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
      <NewSalesOrderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
}
