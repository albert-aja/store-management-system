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
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useEmployees } from "../employees/hooks";
import { useStores } from "../stores/hooks";
import { useCreateDeliveryTrip, useDeliveryTrips } from "./hooks";
import type { DeliveryTrip, DeliveryTripStatus } from "./types";

const STATUSES: DeliveryTripStatus[] = [
  "PLANNED",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
];

function NewTripDialog({ onClose }: { onClose: () => void }) {
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
        notes: notes || undefined,
      });
      enqueueSnackbar("Delivery trip planned", { variant: "success" });
      onClose();
      navigate(`/delivery-trips/${trip.id}`);
    } catch {
      enqueueSnackbar("Failed to create delivery trip", { variant: "error" });
    }
  };

  const activeEmployees = (employees ?? []).filter(
    (e) => e.employmentStatus === "ACTIVE",
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Delivery Trip (Picking / Dispatch)</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          select
          label="Store"
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
          label="Driver"
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
          label="Helper (Optional)"
          size="small"
          fullWidth
          value={helperId}
          onChange={(e) => setHelperId(e.target.value)}
        >
          <MenuItem value="">None</MenuItem>
          {activeEmployees
            .filter((e) => e.id !== driverId)
            .map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.fullName}
              </MenuItem>
            ))}
        </TextField>

        <TextField
          label="Vehicle Plate / Details"
          size="small"
          fullWidth
          placeholder="e.g. B 1234 CD (Pickup)"
          value={vehiclePlate}
          onChange={(e) => setVehiclePlate(e.target.value)}
        />

        <TextField
          label="Scheduled Date"
          type="date"
          size="small"
          fullWidth
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Notes"
          size="small"
          fullWidth
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!storeId || !driverId}
          onClick={handleCreate}
        >
          Plan Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DeliveryTripListPage() {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState<DeliveryTripStatus | "">("");
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

  const columns: GridColDef<DeliveryTrip>[] = [
    { field: "tripNumber", headerName: "Trip #", width: 180 },
    { field: "storeName", headerName: "Store", width: 140 },
    { field: "driverName", headerName: "Driver", width: 150 },
    { field: "helperName", headerName: "Helper", width: 140, valueGetter: (_, row) => row.helperName ?? "—" },
    { field: "vehiclePlate", headerName: "Vehicle", width: 130, valueGetter: (_, row) => row.vehiclePlate ?? "—" },
    { field: "scheduledDate", headerName: "Date", width: 120 },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
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
        <Typography variant="h5">Deliveries & Trips</Typography>
        {canManage && (
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            + New Trip
          </Button>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          label="Store"
          size="small"
          sx={{ width: 200 }}
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
          label="Status"
          size="small"
          sx={{ width: 180 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as DeliveryTripStatus | "")}
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

      {dialogOpen && <NewTripDialog onClose={() => setDialogOpen(false)} />}
    </Box>
  );
}
