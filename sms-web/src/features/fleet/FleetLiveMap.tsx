import { useMemo } from "react";
import { Box, Button, Card, CardContent, Chip, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationMap from "../../components/LocationMap";
import type { LiveFleetStatusDto } from "./fleetApi";
import { formatDate, formatNumber, localizeDisplayCode, t, useLanguage } from "../../lib/locale";

interface FleetLiveMapProps {
  workers: LiveFleetStatusDto[];
  selectedEmployeeId?: string | null;
  onSelectEmployee: (employeeId: string) => void;
  onViewRouteHistory?: (sessionId: string) => void;
  height?: number | string;
}

function roleColor(role: string) {
  if (role.includes("SURVEYOR")) return "#7c3aed";
  if (role.includes("COLLECTOR")) return "#059669";
  return "#0284c7";
}

export default function FleetLiveMap({ workers, selectedEmployeeId, onSelectEmployee, onViewRouteHistory, height = 540 }: FleetLiveMapProps) {
  const language = useLanguage();
  const points = useMemo(() => workers.map((worker) => ({
    id: worker.employeeId, label: worker.employeeName,
    latitude: worker.latitude, longitude: worker.longitude,
    color: worker.trackingStatus === "PAUSED" ? "#b45309" : roleColor(worker.employeeRole),
  })), [workers]);
  const selected = workers.find((worker) => worker.employeeId === selectedEmployeeId);

  return (
    <Stack spacing={2}>
      <LocationMap points={points} selectedId={selectedEmployeeId} onSelect={onSelectEmployee} height={height} label={t("Live fleet GPS map", language)} />
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
        {["DRIVER", "SURVEYOR", "COLLECTOR", "PAUSED"].map((role) => (
          <Stack key={role} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: role === "PAUSED" ? "#b45309" : roleColor(role) }} />
            <Typography variant="caption" color="text.secondary">{role === "PAUSED" ? t("Break paused", language) : localizeDisplayCode(role, language)}</Typography>
          </Stack>
        ))}
      </Stack>
      {selected && (
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="subtitle1">{selected.employeeName}</Typography>
                <Typography variant="caption" color="text.secondary">{localizeDisplayCode(selected.employeeRole, language)} / {selected.taskCode}</Typography>
              </Box>
              <IconButton size="small" aria-label={t("Close worker details", language)} onClick={() => onSelectEmployee("")}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ my: 1.5 }}>
              <Chip size="small" label={localizeDisplayCode(selected.trackingStatus, language)} color={selected.trackingStatus === "ACTIVE" ? "success" : selected.trackingStatus === "PAUSED" ? "warning" : "error"} />
              {selected.vehicleRegistrationNumber && <Chip variant="outlined" size="small" label={selected.vehicleRegistrationNumber} />}
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 2 }}>
              {[ [t("Speed", language), selected.speedKmh == null ? t("Unavailable", language) : `${formatNumber(selected.speedKmh, language, { maximumFractionDigits: 1 })} km/h`],
                [t("GPS accuracy", language), selected.accuracyMeters == null ? t("Unavailable", language) : `${formatNumber(selected.accuracyMeters, language, { maximumFractionDigits: 1 })} m`],
                [t("Battery", language), selected.batteryLevelPct == null ? t("Unavailable", language) : `${formatNumber(selected.batteryLevelPct, language)}%`],
                [t("Last ping", language), `${formatDate(selected.lastPingAt, language, { timeStyle: "short", timeZone: "Asia/Jakarta" })} WIB`]].map(([label, value]) => (
                  <Box key={label}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2">{value}</Typography></Box>
                ))}
            </Box>
            {onViewRouteHistory && <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => onViewRouteHistory(selected.sessionId)}>{t("View Route History", language)}</Button>}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
