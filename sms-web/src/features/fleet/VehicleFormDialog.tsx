import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { fleetApi, type CreateVehicleRequest, type VehicleType } from "./fleetApi";
import { t } from "../../lib/locale";

export interface VehicleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreated?: () => void;
}

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "BLIND_VAN", label: t("Blind Van (e.g. Gran Max)") },
  { value: "LIGHT_TRUCK_4W", label: t("Light Truck 4-Wheel (e.g. Traga / Canter)") },
  { value: "PICKUP_TRUCK", label: t("Pick-Up Flatbed (e.g. L300 / Carry)") },
  { value: "MOTORCYCLE", label: t("Motorcycle / Courier (e.g. BeAT / Vario)") },
  { value: "MEDIUM_TRUCK_6W", label: t("Medium Truck 6-Wheel") },
];

const FUEL_TYPES = ["GASOLINE_RON90", "GASOLINE_RON92", "DIESEL_CN48", "ELECTRIC"];

export default function VehicleFormDialog({
  open,
  onClose,
  onSuccess,
  onCreated,
}: VehicleFormDialogProps) {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("BLIND_VAN");
  const [brandModel, setBrandModel] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [maxPayloadKg, setMaxPayloadKg] = useState<number | "">(850);
  const [maxVolumeCbm, setMaxVolumeCbm] = useState<number | "">(4.2);
  const [fuelType, setFuelType] = useState("GASOLINE_RON90");
  const [odometerKm, setOdometerKm] = useState<number | "">(0);
  const [lastServiceOdometerKm, setLastServiceOdometerKm] = useState<number | "">(0);
  const [serviceIntervalKm, setServiceIntervalKm] = useState<number | "">(10000);
  const [stnkExpiryDate, setStnkExpiryDate] = useState("");
  const [kirExpiryDate, setKirExpiryDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim()) {
      setError(t("License plate / registration number is required."));
      return;
    }
    if (!brandModel.trim()) {
      setError(t("Brand and model name is required."));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: CreateVehicleRequest = {
        registrationNumber: registrationNumber.trim().toUpperCase(),
        vehicleType,
        brandModel: brandModel.trim(),
        chassisNumber: chassisNumber.trim() || undefined,
        engineNumber: engineNumber.trim() || undefined,
        maxPayloadKg: maxPayloadKg !== "" ? Number(maxPayloadKg) : undefined,
        maxVolumeCbm: maxVolumeCbm !== "" ? Number(maxVolumeCbm) : undefined,
        fuelType: fuelType || undefined,
        odometerKm: odometerKm !== "" ? Number(odometerKm) : undefined,
        lastServiceOdometerKm: lastServiceOdometerKm !== "" ? Number(lastServiceOdometerKm) : undefined,
        serviceIntervalKm: serviceIntervalKm !== "" ? Number(serviceIntervalKm) : undefined,
        stnkExpiryDate: stnkExpiryDate || undefined,
        kirExpiryDate: kirExpiryDate || undefined,
      };

      await fleetApi.createVehicle(payload);

      if (onSuccess) onSuccess();
      if (onCreated) onCreated();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("Failed to register new fleet vehicle.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("Register Fleet Vehicle")}</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label={t("Registration Plate (Nomor Polisi)")}
              placeholder={t("e.g. B 9283 TXT")}
              fullWidth
              required
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              slotProps={{ htmlInput: { style: { textTransform: "uppercase" } } }}
            />

            <TextField
              select
              label={t("Vehicle Category")}
              fullWidth
              required
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
            >
              {VEHICLE_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
              <TextField
                label={t("Brand & Model")}
                placeholder={t("e.g. Daihatsu Gran Max Blind Van 1.3 D")}
                fullWidth
                required
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
              />
            </Box>

            <TextField
              label={t("Chassis Number (VIN)")}
              placeholder={t("e.g. MHKM401...")}
              fullWidth
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
            />

            <TextField
              label={t("Engine Number")}
              placeholder={t("e.g. K3-DE-12345")}
              fullWidth
              value={engineNumber}
              onChange={(e) => setEngineNumber(e.target.value)}
            />

            <TextField
              label={t("Max Payload (kg)")}
              type="number"
              fullWidth
              value={maxPayloadKg}
              onChange={(e) =>
                setMaxPayloadKg(e.target.value === "" ? "" : Number(e.target.value))
              }
            />

            <TextField
              label={t("Max Cargo Volume (m³)")}
              type="number"
              fullWidth
              value={maxVolumeCbm}
              onChange={(e) =>
                setMaxVolumeCbm(e.target.value === "" ? "" : Number(e.target.value))
              }
            />

            <TextField
              select
              label={t("Fuel Type")}
              fullWidth
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            >
              {FUEL_TYPES.map((f) => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label={t("Current Odometer (km)")}
              type="number"
              fullWidth
              value={odometerKm}
              onChange={(e) =>
                setOdometerKm(e.target.value === "" ? "" : Number(e.target.value))
              }
            />

            <TextField
              label={t("Last Service Odometer (km)")}
              type="number"
              fullWidth
              value={lastServiceOdometerKm}
              onChange={(e) =>
                setLastServiceOdometerKm(e.target.value === "" ? "" : Number(e.target.value))
              }
            />

            <TextField
              label={t("Service Interval (km)")}
              type="number"
              fullWidth
              value={serviceIntervalKm}
              onChange={(e) =>
                setServiceIntervalKm(e.target.value === "" ? "" : Number(e.target.value))
              }
            />

            <TextField
              label={t("STNK Expiry Date")}
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={stnkExpiryDate}
              onChange={(e) => setStnkExpiryDate(e.target.value)}
            />

            <TextField
              label={t("KIR Expiry Date")}
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={kirExpiryDate}
              onChange={(e) => setKirExpiryDate(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none" }}>
            {t("Cancel")}</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ textTransform: "none", borderRadius: 1.5 }}
          >
            {loading ? t("Registering...") : t("Register Vehicle")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
