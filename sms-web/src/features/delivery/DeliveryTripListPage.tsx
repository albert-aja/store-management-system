import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid";
import BulkActionBar from "../../components/BulkActionBar";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useEmployees } from "../employees/hooks";
import { useStores } from "../stores/hooks";
import { useCreateDeliveryTrip, useDeliveryTrips } from "./hooks";
import type { DeliveryTrip, DeliveryTripStatus } from "./types";
import { DeliveryReschedulePanel } from "./DeliveryReschedulePanel";
import { formatDate, localizeDisplayCode, t, useLanguage } from "../../lib/locale";

const INITIAL_SELECTION: GridRowSelectionModel = { type: "include", ids: new Set() };

const STATUSES: DeliveryTripStatus[] = [
  "PLANNED",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
];

function NewTripDialog({ onClose }: { onClose: () => void }) {
  const language = useLanguage();
  const { data: stores } = useStores();
  const { data: employees } = useEmployees();
  const [storeId, setStoreId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [helperId, setHelperId] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [dispatchTime, setDispatchTime] = useState("");

  const createTrip = useCreateDeliveryTrip();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleCreate = async () => {
    try {
      const trip = await createTrip.mutateAsync({
        storeId,
        driverEmployeeId: driverId,
        helperEmployeeId: helperId || undefined,
        vehiclePlate: vehiclePlate || undefined,
        scheduledDate,
        plannedDispatchAt: dispatchTime ? `${scheduledDate}T${dispatchTime}:00+07:00` : undefined,
        notes: notes || undefined,
      });
      enqueueSnackbar(t("Delivery trip planned", language), { variant: "success" });
      onClose();
      navigate(`/delivery-trips/${trip.id}`);
    } catch {
      enqueueSnackbar(t("Failed to create delivery trip", language), { variant: "error" });
    }
  };

  const activeEmployees = (employees ?? []).filter(
    (e) => e.employmentStatus === "ACTIVE",
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("New Delivery Trip (Picking / Dispatch)", language)}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          select
          label={t("Store", language)}
          size="small"
          required
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
          label={t("Driver", language)}
          size="small"
          required
          fullWidth
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
        >
          {activeEmployees.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.fullName}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label={t("Helper (Optional)", language)}
          size="small"
          fullWidth
          value={helperId}
          onChange={(e) => setHelperId(e.target.value)}
        >
          <MenuItem value="">{t("None", language)}</MenuItem>
          {activeEmployees
            .filter((e) => e.id !== driverId)
            .map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.fullName}
              </MenuItem>
            ))}
        </TextField>

        <TextField
          label={t("Vehicle Plate / Details", language)}
          size="small"
          fullWidth
          placeholder={t("e.g. B 1234 CD (Pickup)", language)}
          value={vehiclePlate}
          onChange={(e) => setVehiclePlate(e.target.value)}
        />

        <TextField
          label={t("Scheduled Date", language)}
          type="date"
          size="small"
          fullWidth
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label={t("Planned dispatch time (WIB, optional)", language)}
          type="time"
          size="small"
          value={dispatchTime}
          onChange={(event) => setDispatchTime(event.target.value)}
          helperText={t("Set actual departure time to enable the customer 24-hour reschedule cutoff.", language)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label={t("Notes", language)}
          size="small"
          fullWidth
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel", language)}</Button>
        <Button
          variant="contained"
          disabled={!storeId || !driverId}
          onClick={handleCreate}
        >
          {t("Plan Trip", language)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DeliveryTripListPage() {
  const language = useLanguage();
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState<DeliveryTripStatus | "">("");
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowSelectionModel>(INITIAL_SELECTION);
  const { data, isLoading } = useDeliveryTrips({
    storeId: storeId || undefined,
    status: status || undefined,
  });
  const canManage = useAuthStore(
    (s) =>
      s.hasPermission("DELIVERY_MANAGE") || s.hasPermission("DELIVERY_EXECUTE"),
  );
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const canReschedule = useAuthStore((s) => s.hasPermission("DELIVERY_MANAGE"));

  const columns: GridColDef<DeliveryTrip>[] = [
    { field: "tripNumber", headerName: t("Trip #", language), width: 180 },
    { field: "storeName", headerName: t("Store", language), width: 140 },
    { field: "driverName", headerName: t("Driver", language), width: 150 },
    { field: "helperName", headerName: t("Helper", language), width: 140, valueGetter: (_, row) => row.helperName ?? "—" },
    { field: "vehiclePlate", headerName: t("Vehicle", language), width: 130, valueGetter: (_, row) => row.vehiclePlate ?? "—" },
    { field: "scheduledDate", headerName: t("Date", language), width: 120, valueFormatter: (value: string | null) => value ? formatDate(value, language, { dateStyle: "medium", timeZone: "UTC" }) : "" },
    {
      field: "status",
      headerName: t("Status", language),
      width: 140,
      renderCell: (params) => (
        <Chip
          label={localizeDisplayCode(params.row.status, language)}
          size="small"
          color={
            params.row.status === "COMPLETED"
              ? "success"
              : params.row.status === "DISPATCHED"
                ? "primary"
                : params.row.status === "CANCELLED"
                  ? "error"
                  : "default"
          }
        />
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: (params) => (
        <Button
          size="small"
          onClick={() => navigate(`/delivery-trips/${params.row.id}`)}
        >
          {t("Open", language)}
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
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h5">{t("Deliveries & Trips", language)}</Typography>
        {canManage && (
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            + {t("New Trip", language)}
          </Button>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          label={t("Store", language)}
          size="small"
          sx={{ width: 200 }}
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <MenuItem value="">{t("All Stores", language)}</MenuItem>
          {(stores ?? []).map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label={t("Status", language)}
          size="small"
          sx={{ width: 180 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as DeliveryTripStatus | "")}
        >
          <MenuItem value="">{t("All Statuses", language)}</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {localizeDisplayCode(s, language)}
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

      <BulkActionBar
        selectedRowIds={selectedRowIds}
        totalCount={data?.length ?? 0}
        onClearSelection={() => setSelectedRowIds(INITIAL_SELECTION)}
        columns={columns}
        rows={data ?? []}
        exportFilename="delivery_trips"
        exportTitle={t("Delivery schedule and fleet manifest", language)}
      />

      {dialogOpen && <NewTripDialog onClose={() => setDialogOpen(false)} />}
      {canReschedule && <DeliveryReschedulePanel />}
    </Box>
  );
}
