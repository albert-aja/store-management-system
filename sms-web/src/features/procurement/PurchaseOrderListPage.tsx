import { useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { DataGrid, type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../stores/hooks";
import {
  useBulkUpdatePurchaseOrders,
  useCreatePurchaseOrder,
  usePurchaseOrders,
  useSupplierSearch,
} from "./hooks";
import type { PurchaseOrder, PurchaseOrderStatus } from "./types";
import BulkActionBar from "../../components/BulkActionBar";
import { extractSelectedRowIds } from "../../lib/exportDataGrid";
import { t } from "../../lib/locale";

const INITIAL_SELECTION: GridRowSelectionModel = { type: "include", ids: new Set() };

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
      <DialogTitle>{t("New Draft Purchase Order")}</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
      >
        <TextField
          select
          label={t("Store")}
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
          label={t("Supplier")}
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
        <Button onClick={onClose}>{t("Cancel")}</Button>
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
          {t("Create Draft")}
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
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowSelectionModel>(INITIAL_SELECTION);
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = usePurchaseOrders({
    storeId: storeId || undefined,
    supplierId: supplierId || undefined,
    status: status || undefined,
  });

  const canManage = useAuthStore((s) => s.hasPermission("PROCUREMENT_MANAGE"));
  const bulkUpdateMutation = useBulkUpdatePurchaseOrders();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns: GridColDef<PurchaseOrder>[] = [
    {
      field: "number",
      headerName: t("Number"),
      width: 200,
      valueGetter: (_, row) => row.number ?? "(Draft)",
    },
    { field: "supplierName", headerName: t("Supplier"), flex: 1 },
    { field: "status", headerName: t("Status"), width: 180 },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: (params: { row: PurchaseOrder }) => (
        <Button
          size="small"
          onClick={() => navigate(`/purchase-orders/${params.row.id}`)}
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
        <Typography variant="h5">{t("Purchase Orders")}</Typography>
        {canManage && (
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            {t("New Draft PO")}
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
          {(stores ?? []).map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t("Supplier")}
          size="small"
          sx={{ width: 220 }}
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <MenuItem value="">{t("All Suppliers")}</MenuItem>
          {(suppliers ?? []).map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t("Status")}
          size="small"
          sx={{ width: 220 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as PurchaseOrderStatus | "")}
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
      {dialogOpen && (
        <NewPurchaseOrderDialog onClose={() => setDialogOpen(false)} />
      )}

      {/* Bulk Operations Bar */}
      <BulkActionBar
        selectedRowIds={selectedRowIds}
        totalCount={data?.length ?? 0}
        onClearSelection={() => setSelectedRowIds(INITIAL_SELECTION)}
        columns={columns}
        rows={data ?? []}
        exportFilename="purchase_orders"
        exportTitle="DAFTAR PURCHASE ORDER PENGADAAN (SUPPLIER PROCUREMENT)"
        statusUpdate={{
          title: t("Pembaruan Status Purchase Order Massal"),
          statusOptions: [
            {
              value: "ISSUE",
              label: t("Issue (Terbitkan Nomor PO)"),
              description: t("Terbitkan Purchase Order yang telah disetujui (Approved) ke distributor."),
            },
            {
              value: "CANCEL",
              label: t("Cancel (Batalkan Purchase Order)"),
              description: t("Batalkan draft PO atau PO tanpa dokumen penerimaan barang."),
            },
          ],
          requireReason: false,
          onConfirm: async (action, reason) => {
            const poIds = extractSelectedRowIds(selectedRowIds, data ?? []) as string[];
            const res = await bulkUpdateMutation.mutateAsync({
              ids: poIds,
              action,
              reason,
            });
            setSelectedRowIds(INITIAL_SELECTION);
            enqueueSnackbar(
              t("Bulk PO update complete: {success} successful, {failure} failed.", undefined, { success: res.successCount, failure: res.failureCount }),
              { variant: res.failureCount > 0 ? "warning" : "success" }
            );
          },
        }}
      />
    </Box>
  );
}
