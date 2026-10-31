import { useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../stores/hooks";
import NewSalesOrderDialog from "./NewSalesOrderDialog";
import { useBulkUpdateSalesOrders, useSalesOrders } from "./hooks";
import type { SalesOrder, SalesOrderStatus } from "./types";
import BulkActionBar from "../../components/BulkActionBar";
import { extractSelectedRowIds } from "../../lib/exportDataGrid";
import { t } from "../../lib/locale";

const STATUSES: SalesOrderStatus[] = [
  "DRAFT",
  "PENDING_PRICE_APPROVAL",
  "REJECTED",
  "RELEASED",
  "SURVEY_REJECTED",
  "CONFIRMED",
  "CANCELLED",
];

const INITIAL_SELECTION: GridRowSelectionModel = { type: "include", ids: new Set() };

export default function SalesOrderListPage() {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState<SalesOrderStatus | "">("");
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowSelectionModel>(INITIAL_SELECTION);
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useSalesOrders({
    storeId: storeId || undefined,
    status: status || undefined,
  });

  const canManage = useAuthStore((s) => s.hasPermission("SALES_ORDER_MANAGE"));
  const bulkUpdateMutation = useBulkUpdateSalesOrders();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns: GridColDef<SalesOrder>[] = [
    {
      field: "number",
      headerName: t("Number"),
      width: 200,
      valueGetter: (_, row) => row.number ?? "(Draft)",
    },
    { field: "customerName", headerName: t("Customer"), flex: 1 },
    { field: "status", headerName: t("Status"), width: 180 },
    {
      field: "requiresPriceApproval",
      headerName: t("Negotiated"),
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
          {t("Open")}</Button>
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
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h5">{t("Sales Orders")}</Typography>
        {canManage && (
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            {t("New Draft SO")}
          </Button>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          label={t("Store")}
          size="small"
          sx={{ width: 220 }}
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <MenuItem value="">{t("All Stores")}</MenuItem>
          {(stores ?? []).map((store) => (
            <MenuItem key={store.id} value={store.id}>
              {store.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t("Status")}
          size="small"
          sx={{ width: 220 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as SalesOrderStatus | "")}
        >
          <MenuItem value="">{t("All Statuses")}</MenuItem>
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
        checkboxSelection
        rowSelectionModel={selectedRowIds}
        onRowSelectionModelChange={(newModel) => setSelectedRowIds(newModel)}
        disableRowSelectionOnClick
      />
      <NewSalesOrderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      <BulkActionBar
        selectedRowIds={selectedRowIds}
        totalCount={data?.length ?? 0}
        onClearSelection={() => setSelectedRowIds(INITIAL_SELECTION)}
        columns={columns}
        rows={data ?? []}
        exportFilename="sales_orders"
        exportTitle="DAFTAR TRANSAKSI SALES ORDER"
        statusUpdate={{
          title: t("Pembaruan Status Sales Order Massal"),
          statusOptions: [
            {
              value: "RELEASE",
              label: t("Release (Rilis Pesanan)"),
              description: t("Rilis draft untuk proses alokasi barang / pengiriman."),
            },
            {
              value: "CONFIRM",
              label: t("Confirm (Konfirmasi Pesanan)"),
              description: t("Konfirmasi pesanan setelah verifikasi uang muka (DP)."),
            },
            {
              value: "CANCEL",
              label: t("Cancel (Batalkan Pesanan)"),
              description: t("Batalkan draft/order dan kembalikan reservasi stok."),
            },
          ],
          requireReason: false,
          onConfirm: async (action, reason) => {
            const ids = extractSelectedRowIds(selectedRowIds, data ?? []).map(String);
            const res = await bulkUpdateMutation.mutateAsync({
              ids,
              action,
              reason,
            });
            setSelectedRowIds(INITIAL_SELECTION);
            enqueueSnackbar(
              t("Bulk update complete: {success} successful, {failure} failed.", undefined, { success: res.successCount, failure: res.failureCount }),
              { variant: res.failureCount > 0 ? "warning" : "success" }
            );
          },
        }}
        printOptions={[
          {
            type: "SALES_ORDER_INVOICE",
            label: t("Cetak Faktur Penjualan / Nota"),
          },
          {
            type: "CREDIT_AGREEMENT",
            label: t("Cetak Akta Perjanjian Kredit"),
          },
        ]}
      />
    </Box>
  );
}
