import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid";
import { useSnackbar } from "notistack";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TableChartIcon from "@mui/icons-material/TableChart";
import { exportStockBalanceToExcel } from "../../lib/exportExcel";
import { extractSelectedRowIds } from "../../lib/exportDataGrid";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../stores/hooks";
import ReceiveStockUnitDialog from "./ReceiveStockUnitDialog";
import TransferStockUnitDialog from "./TransferStockUnitDialog";
import StockMovementHistoryDrawer from "./StockMovementHistoryDrawer";
import { useAdjustAvailability, useBulkAdjustAvailability, useStockUnits } from "./hooks";
import type { StockAvailability, StockLocationType, StockUnit } from "./types";
import BulkActionBar from "../../components/BulkActionBar";
import { t } from "../../lib/locale";

const INITIAL_SELECTION: GridRowSelectionModel = { type: "include", ids: new Set() };

const AVAILABILITIES: StockAvailability[] = [
  "AVAILABLE",
  "RESERVED",
  "UNAVAILABLE",
];

const LOCATION_TYPES: StockLocationType[] = [
  "WAREHOUSE",
  "SHOWROOM",
  "IN_TRANSIT",
  "REPAIR_AREA",
  "AT_CUSTOMER",
  "DISPOSED",
];

export default function StockUnitListPage() {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const [availability, setAvailability] = useState<StockAvailability | "">("");
  const [locationType, setLocationType] = useState<StockLocationType | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowSelectionModel>(INITIAL_SELECTION);
  const { enqueueSnackbar } = useSnackbar();

  const { data = [], isLoading } = useStockUnits({
    storeId: storeId || undefined,
    availability: availability || undefined,
  });

  const canManage = useAuthStore((s) => s.hasPermission("INVENTORY_MANAGE"));
  const adjustAvailability = useAdjustAvailability();
  const bulkAdjustAvailability = useBulkAdjustAvailability();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<StockUnit | null>(null);
  const [movementDrawerUnit, setMovementDrawerUnit] = useState<StockUnit | null>(null);

  // Filter rows in memory based on search query and location type
  const filteredRows = useMemo(() => {
    return data.filter((unit) => {
      if (locationType && unit.locationType !== locationType) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const serial = (unit.manufacturerSerial ?? "").toLowerCase();
      const variant = (unit.variantName ?? "").toLowerCase();
      const notes = (unit.notes ?? "").toLowerCase();
      return serial.includes(q) || variant.includes(q) || notes.includes(q);
    });
  }, [data, locationType, searchQuery]);

  const columns: GridColDef<StockUnit>[] = [
    {
      field: "manufacturerSerial",
      headerName: t("Serial Number"),
      width: 180,
      valueGetter: (_, row) => row.manufacturerSerial || "(Non-serialized)",
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {params.value}
        </Typography>
      ),
    },
    { field: "variantName", headerName: t("Product Variant"), flex: 1, minWidth: 200 },
    {
      field: "locationType",
      headerName: t("Location"),
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.75rem" }}
        />
      ),
    },
    {
      field: "availabilityStatus",
      headerName: t("Availability"),
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === "AVAILABLE"
              ? "success"
              : params.value === "RESERVED"
              ? "warning"
              : "error"
          }
          sx={{ fontSize: "0.75rem", fontWeight: 600 }}
        />
      ),
    },
    {
      field: "actions",
      headerName: t("Actions"),
      width: 220,
      sortable: false,
      renderCell: (params: { row: StockUnit }) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* Movement Ledger Audit */}
          <Tooltip title={t("View Stock Movement Audit Trail")}>
            <IconButton
              size="small"
              onClick={() => setMovementDrawerUnit(params.row)}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {canManage && (
            <>
              {/* Transfer */}
              <Tooltip title={t("Transfer Stock Unit")}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setTransferTarget(params.row)}
                >
                  <SwapHorizIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Availability Toggle */}
              {params.row.availabilityStatus !== "UNAVAILABLE" ? (
                <Tooltip title={t("Mark as Unavailable")}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      const reason = window.prompt(t("Reason for marking unavailable?"));
                      if (reason !== null) {
                        adjustAvailability.mutate({
                          id: params.row.id,
                          status: "UNAVAILABLE",
                          reason: reason || undefined,
                        });
                      }
                    }}
                  >
                    <BlockIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title={t("Mark as Available")}>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() =>
                      adjustAvailability.mutate({
                        id: params.row.id,
                        status: "AVAILABLE",
                      })
                    }
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Title & Actions */}
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
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t("Stock Units & Ledger")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("Serialized unit tracking, showroom inventory, and physical movement logs")}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            color="success"
            startIcon={<TableChartIcon />}
            onClick={() =>
              exportStockBalanceToExcel({
                storeName: stores?.find((s) => s.id === storeId)?.name || "All Stores",
                stockUnits: filteredRows,
              })
            }
          >
            {t("Export Stock Excel (.xlsx)")}
          </Button>
          {canManage && (
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
              {t("Receive Stock Unit")}
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter & Search Bar */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
          mb: 2,
        }}
      >
        <TextField
          placeholder={t("Filter by serial or variant...")}
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: "100%", sm: 260 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          label={t("Store")}
          size="small"
          sx={{ width: 180 }}
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
          label={t("Availability")}
          size="small"
          sx={{ width: 160 }}
          value={availability}
          onChange={(e) =>
            setAvailability(e.target.value as StockAvailability | "")
          }
        >
          <MenuItem value="">{t("All Statuses")}</MenuItem>
          {AVAILABILITIES.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label={t("Location Type")}
          size="small"
          sx={{ width: 170 }}
          value={locationType}
          onChange={(e) =>
            setLocationType(e.target.value as StockLocationType | "")
          }
        >
          <MenuItem value="">{t("All Locations")}</MenuItem>
          {LOCATION_TYPES.map((loc) => (
            <MenuItem key={loc} value={loc}>
              {loc}
            </MenuItem>
          ))}
        </TextField>

        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
          {t("Showing")} {filteredRows.length} {t("of")}{data.length} {t("units")}</Typography>
      </Box>

      {/* High-Performance Virtualized Data Grid */}
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          checkboxSelection
          rowSelectionModel={selectedRowIds}
          onRowSelectionModelChange={(newModel) => setSelectedRowIds(newModel)}
          disableRowSelectionOnClick
          density="standard"
        />
      </Box>

      {/* Dialogs & Audit Drawer */}
      <ReceiveStockUnitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <TransferStockUnitDialog
        open={!!transferTarget}
        stockUnit={transferTarget}
        onClose={() => setTransferTarget(null)}
      />
      <StockMovementHistoryDrawer
        stockUnit={movementDrawerUnit}
        open={!!movementDrawerUnit}
        onClose={() => setMovementDrawerUnit(null)}
      />

      {/* Bulk Operations Bar */}
      <BulkActionBar
        selectedRowIds={selectedRowIds}
        totalCount={filteredRows.length}
        onClearSelection={() => setSelectedRowIds(INITIAL_SELECTION)}
        columns={columns}
        rows={filteredRows}
        exportFilename="stock_units_inventory"
        exportTitle="INVENTARIS UNIT FISIK (STOCK UNITS & LEDGER)"
        statusUpdate={{
          title: t("Pembaruan Ketersediaan Unit Massal"),
          statusOptions: [
            {
              value: "AVAILABLE",
              label: t("Available (Siap Dijual / Display)"),
              description: t("Unit siap dipajang di showroom atau dialokasikan ke pesanan."),
            },
            {
              value: "RESERVED",
              label: t("Reserved (Dipesan)"),
              description: t("Unit dikunci untuk pesanan pelanggan / sedang diproses."),
            },
            {
              value: "UNAVAILABLE",
              label: t("Unavailable (Karantina / Rusak / Servis)"),
              description: t("Unit cacat fisik atau membutuhkan perbaikan teknis."),
            },
          ],
          requireReason: true,
          reasonLabel: "Alasan Penyesuaian Ketersediaan Stok (Audit Log)",
          onConfirm: async (status, reason) => {
            const unitIds = extractSelectedRowIds(selectedRowIds, filteredRows) as string[];
            const res = await bulkAdjustAvailability.mutateAsync({
              ids: unitIds,
              availability: status as StockAvailability,
              reason,
            });
            setSelectedRowIds(INITIAL_SELECTION);
            enqueueSnackbar(
              t("Bulk stock update complete: {success} successful, {failure} failed.", undefined, { success: res.successCount, failure: res.failureCount }),
              { variant: res.failureCount > 0 ? "warning" : "success" }
            );
          },
        }}
      />
    </Box>
  );
}
