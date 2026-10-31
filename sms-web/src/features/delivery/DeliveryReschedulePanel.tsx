import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { isAxiosError } from "axios";
import { apiClient } from "../../lib/apiClient";
import { useDeliveryTrips } from "./hooks";
import { deliveryTripsApi } from "./api";
import type { DeliveryTrip } from "./types";
import { formatDate, t, translateKnownBackendMessage, useLanguage } from "../../lib/locale";

interface RescheduleRequest {
  id: string;
  deliveryOrderNumber: string;
  storeId: string;
  requestedDate: string;
  requestedWindow: "MORNING" | "AFTERNOON";
  reason: string | null;
}

function errorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error) && error.response?.data.message) {
    return translateKnownBackendMessage(error.response.data.message);
  }
  return translateKnownBackendMessage(error instanceof Error ? error.message : t("Delivery schedule request failed"));
}

function RequestReview({ request }: { request: RescheduleRequest }) {
  const language = useLanguage();
  const [targetTripId, setTargetTripId] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { data: trips = [] } = useDeliveryTrips({ storeId: request.storeId, status: "PLANNED" });
  const candidates = trips.filter((trip) => trip.scheduledDate === request.requestedDate && trip.plannedDispatchAt);
  const decision = useMutation({
    mutationFn: (action: "approve" | "reject") =>
      apiClient.post(`/api/delivery-reschedules/${request.id}/${action}`, {
        targetTripId: action === "approve" ? targetTripId : undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["delivery-reschedules"] });
      void queryClient.invalidateQueries({ queryKey: ["delivery-trips"] });
      void queryClient.invalidateQueries({ queryKey: ["delivery-orders-trip"] });
      void queryClient.invalidateQueries({ queryKey: ["delivery-orders-so"] });
    },
  });
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 600 }}>{request.deliveryOrderNumber}</Typography>
        <Typography variant="body2">
          {t("Requested:", language)} {formatDate(request.requestedDate, language, { dateStyle: "long", timeZone: "UTC" })} · {request.requestedWindow === "MORNING" ? "09:00–12:00" : "12:00–17:00"} {t("WIB")}
        </Typography>
        {request.reason && <Typography variant="body2">{request.reason}</Typography>}
        <TextField
          select size="small" label={t("Assign requested stop to trip", language)} value={targetTripId}
          onChange={(event) => setTargetTripId(event.target.value)}
        >
          {candidates.map((trip) => (
            <MenuItem key={trip.id} value={trip.id}>{trip.tripNumber} · {trip.driverName ?? t("Driver", language)}</MenuItem>
          ))}
        </TextField>
        {candidates.length === 0 && (
          <Alert severity="info">{t("Create a planned trip on the requested date and set its departure time before approval.", language)}</Alert>
        )}
        <TextField
          size="small" label={t("Decision notes (required for rejection)", language)} value={notes}
          onChange={(event) => setNotes(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 300 } }}
        />
        {decision.error && <Alert severity="error">{errorMessage(decision.error)}</Alert>}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button disabled={!targetTripId || decision.isPending} variant="contained" onClick={() => decision.mutate("approve")}>{t("Approve request", language)}</Button>
          <Button disabled={!notes.trim() || decision.isPending} color="error" onClick={() => decision.mutate("reject")}>{t("Reject request", language)}</Button>
        </Box>
      </Stack>
    </Paper>
  );
}

export function DeliveryReschedulePanel() {
  const language = useLanguage();
  const requests = useQuery({
    queryKey: ["delivery-reschedules"],
    queryFn: () => apiClient.get<RescheduleRequest[]>("/api/delivery-reschedules").then((response) => response.data),
  });
  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{t("Customer reschedule requests", language)}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("Approval moves only the requested delivery stop. Original and replacement dispatch must remain at least 24 hours away.", language)}
      </Typography>
      {requests.isLoading && <Typography>{t("Loading requests...", language)}</Typography>}
      {requests.error && <Alert severity="error">{errorMessage(requests.error)}</Alert>}
      {requests.data?.length === 0 && <Typography color="text.secondary">{t("No requests awaiting review.", language)}</Typography>}
      <Stack spacing={2}>{requests.data?.map((request) => <RequestReview key={request.id} request={request} />)}</Stack>
    </Paper>
  );
}

export function PlannedDispatchEditor({ trip }: { trip: DeliveryTrip }) {
  const language = useLanguage();
  const [departure, setDeparture] = useState("");
  const queryClient = useQueryClient();
  const schedule = useMutation({
    mutationFn: () => deliveryTripsApi.schedule(trip.id, `${departure}:00+07:00`),
    onSuccess: () => {
      setDeparture("");
      void queryClient.invalidateQueries({ queryKey: ["delivery-trip", trip.id] });
      void queryClient.invalidateQueries({ queryKey: ["delivery-trips"] });
    },
  });
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography sx={{ mb: 1 }}>
        {t("Planned dispatch:", language)} {trip.plannedDispatchAt
          ? `${formatDate(trip.plannedDispatchAt, language, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })} WIB`
          : t("Not set — customer rescheduling unavailable", language)}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <TextField
          label={t("New planned dispatch (WIB)", language)} type="datetime-local" size="small"
          value={departure} onChange={(event) => setDeparture(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button disabled={!departure || schedule.isPending} onClick={() => schedule.mutate()}>{t("Save dispatch time", language)}</Button>
      </Box>
      {schedule.error && <Alert severity="error" sx={{ mt: 1 }}>{errorMessage(schedule.error)}</Alert>}
    </Paper>
  );
}
