import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  useCancelDeliveryTrip,
  useCompleteDeliveryTrip,
  useDeliverOrder,
  useDeliveryOrdersByTrip,
  useDeliveryTrip,
  useDispatchDeliveryTrip,
  useFailOrder,
  useRecordPreInspection,
} from "./hooks";
import type { DeliveryOrder } from "./types";
import DeliveryRouteMap from "./DeliveryRouteMap";
import { PlannedDispatchEditor } from "./DeliveryReschedulePanel";
import { t, formatDate, formatNumber , localizeDisplayCode} from "../../lib/locale";

// ── Modals ──────────────────────────────────────────────────────────────────

function PreInspectionDialog({
  order,
  tripId,
  onClose,
}: {
  order: DeliveryOrder;
  tripId: string;
  onClose: () => void;
}) {
  const [passed, setPassed] = useState(order.preInspectionPassed ?? true);
  const [notes, setNotes] = useState(order.preInspectionNotes ?? "");
  const record = useRecordPreInspection(order.id, tripId);
  const { enqueueSnackbar } = useSnackbar();

  const handleSave = () => {
    record.mutate(
      { passed, notes: notes || undefined },
      {
        onSuccess: () => {
          enqueueSnackbar(t("Pre-delivery inspection updated"), {
            variant: "success",
          });
          onClose();
        },
        onError: () =>
          enqueueSnackbar(t("Failed to update pre-inspection"), {
            variant: "error",
          }),
      },
    );
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("Pre-Delivery Inspection")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t("Verify product completeness, condition, and packaging with the driver before departure (README 11.1).")}</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={passed}
              onChange={(e) => setPassed(e.target.checked)}
            />
          }
          label={passed ? t("Inspection Passed (Ready to Load)") : t("Inspection Failed")}
        />
        <TextField
          label={t("Inspection Notes / Checklist")}
          multiline
          rows={2}
          size="small"
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button variant="contained" onClick={handleSave}>
          {t("Save Inspection")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeliverOrderDialog({
  order,
  tripId,
  onClose,
}: {
  order: DeliveryOrder;
  tripId: string;
  onClose: () => void;
}) {
  const [signedBy, setSignedBy] = useState(order.recipientName ?? "");
  const [proofPhotoUrl, setProofPhotoUrl] = useState("");
  const [codCollected, setCodCollected] = useState(
    order.codAmount > 0 ? String(order.codAmount) : "",
  );
  const [codNotes, setCodNotes] = useState("");
  const [notes, setNotes] = useState("");
  const deliver = useDeliverOrder(order.id, tripId, order.salesOrderId);
  const { enqueueSnackbar } = useSnackbar();

  const handleComplete = () => {
    deliver.mutate(
      {
        signedBy: signedBy || undefined,
        proofPhotoUrl: proofPhotoUrl || undefined,
        codCollected: codCollected ? parseFloat(codCollected) : undefined,
        codNotes: codNotes || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          enqueueSnackbar(t("Delivery marked as completed and inventory updated"), {
            variant: "success",
          });
          onClose();
        },
        onError: () =>
          enqueueSnackbar(t("Failed to record delivery"), { variant: "error" }),
      },
    );
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("Confirm Customer Delivery & Acceptance")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t("Customer inspects and signs confirmation upon acceptance. This officially moves stock units to the customer (README 11.1, 11.2).")}</Typography>

        <TextField
          label={t("Customer / Recipient Signature Name")}
          required
          size="small"
          fullWidth
          value={signedBy}
          onChange={(e) => setSignedBy(e.target.value)}
        />

        <TextField
          label={t("Proof of Delivery / Photo URL")}
          size="small"
          fullWidth
          placeholder={t("https://...")}
          value={proofPhotoUrl}
          onChange={(e) => setProofPhotoUrl(e.target.value)}
        />

        {order.codAmount > 0 && (
          <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("COD Amount to Collect:")} {formatNumber(order.codAmount)}
            </Typography>
            <TextField
              label={t("COD Collected")}
              type="number"
              size="small"
              fullWidth
              value={codCollected}
              onChange={(e) => setCodCollected(e.target.value)}
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              label={t("COD Custody Notes")}
              size="small"
              fullWidth
              sx={{ mt: 1 }}
              value={codNotes}
              onChange={(e) => setCodNotes(e.target.value)}
            />
          </Box>
        )}

        <TextField
          label={t("Installation / Verification Notes")}
          multiline
          rows={2}
          size="small"
          fullWidth
          placeholder={t("Product condition, installation, basic functionality verified")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button
          variant="contained"
          disabled={!signedBy}
          onClick={handleComplete}
        >
          {t("Confirm Delivery")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FailOrderDialog({
  order,
  tripId,
  onClose,
}: {
  order: DeliveryOrder;
  tripId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const fail = useFailOrder(order.id, tripId, order.salesOrderId);
  const { enqueueSnackbar } = useSnackbar();

  const handleFail = () => {
    fail.mutate(
      { failureReason: reason, notes: notes || undefined },
      {
        onSuccess: () => {
          enqueueSnackbar(t("Delivery marked as failed for rescheduling"), {
            variant: "warning",
          });
          onClose();
        },
        onError: () =>
          enqueueSnackbar(t("Failed to record failure"), { variant: "error" }),
      },
    );
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("Record Failed Delivery")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t("Record why delivery could not be completed. Stock allocation remains for rescheduling (README 11.1).")}</Typography>

        <TextField
          label={t("Failure / Rejection Reason")}
          required
          size="small"
          fullWidth
          placeholder={t("e.g. Customer absent, address unreachable, customer rejected")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <TextField
          label={t("Additional Details / Notes")}
          multiline
          rows={2}
          size="small"
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button
          variant="contained"
          color="error"
          disabled={!reason}
          onClick={handleFail}
        >
          {t("Record Failure")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function DeliveryTripDetailPage() {
  const { id = "" } = useParams();
  const { data: trip } = useDeliveryTrip(id);
  const { data: orders = [] } = useDeliveryOrdersByTrip(id);
  const canReschedule = useAuthStore((s) => s.hasPermission("DELIVERY_MANAGE"));
  const canManage = useAuthStore(
    (s) =>
      s.hasPermission("DELIVERY_MANAGE") || s.hasPermission("DELIVERY_EXECUTE"),
  );
  const { enqueueSnackbar } = useSnackbar();

  const dispatchTrip = useDispatchDeliveryTrip(id);
  const completeTrip = useCompleteDeliveryTrip(id);
  const cancelTrip = useCancelDeliveryTrip(id);

  const [activeInspectionOrder, setActiveInspectionOrder] =
    useState<DeliveryOrder | null>(null);
  const [activeDeliverOrder, setActiveDeliverOrder] =
    useState<DeliveryOrder | null>(null);
  const [activeFailOrder, setActiveFailOrder] =
    useState<DeliveryOrder | null>(null);

  if (!trip) return null;

  const isPlanned = trip.status === "PLANNED";
  const isDispatched = trip.status === "DISPATCHED";

  const handleDispatch = () => {
    if (orders.length === 0) {
      enqueueSnackbar(t("Assign at least one delivery order before dispatching"), {
        variant: "warning",
      });
      return;
    }
    const uninspected = orders.filter((o) => !o.preInspectionPassed);
    if (uninspected.length > 0) {
      enqueueSnackbar(
        t("Pre-delivery inspection pending for {count} order(s)", undefined, { count: uninspected.length }),
        { variant: "warning" },
      );
      return;
    }
    dispatchTrip.mutate(undefined, {
      onSuccess: () =>
        enqueueSnackbar(t("Trip dispatched — goods in transit"), {
          variant: "success",
        }),
      onError: (err) =>
        enqueueSnackbar(
          err instanceof Error ? err.message : t("Failed to dispatch trip"),
          { variant: "error" },
        ),
    });
  };

  const handleComplete = () => {
    const pendingOrders = orders.filter(
      (o) => o.status === "PENDING" || o.status === "IN_TRANSIT",
    );
    if (pendingOrders.length > 0) {
      enqueueSnackbar(
        t("{count} order(s) still open. Complete or fail all orders first.", undefined, { count: pendingOrders.length }),
        { variant: "warning" },
      );
      return;
    }
    const notes = window.prompt(t("Reconciliation notes (goods return, COD custody handover):"));
    completeTrip.mutate(notes ?? undefined, {
      onSuccess: () =>
        enqueueSnackbar(t("Trip completed and reconciled"), {
          variant: "success",
        }),
      onError: () =>
        enqueueSnackbar(t("Failed to complete trip"), { variant: "error" }),
    });
  };

  const handleCancel = () => {
    const reason = window.prompt(t("Reason for cancelling trip?"));
    if (reason !== null) {
      cancelTrip.mutate(reason || undefined, {
        onSuccess: () =>
          enqueueSnackbar(t("Trip cancelled"), { variant: "info" }),
        onError: () =>
          enqueueSnackbar(t("Failed to cancel trip"), { variant: "error" }),
      });
    }
  };

  return (
    <Box>
      {/* Trip Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, flexWrap: "wrap" }}>
        <Typography variant="h5">{trip.tripNumber}</Typography>
        <Chip
          label={localizeDisplayCode(trip.status)}
          color={
            trip.status === "COMPLETED"
              ? "success"
              : trip.status === "DISPATCHED"
                ? "primary"
                : trip.status === "CANCELLED"
                  ? "error"
                  : "default"
          }
        />
      </Box>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {t("Store:")} {trip.storeName ?? "—"} {t("· Scheduled:")} {formatDate(trip.scheduledDate)}
        {trip.vehiclePlate
          ? ` · ${t("Vehicle: {plate}", undefined, {
              plate: trip.vehiclePlate,
            })}`
          : ""}
      </Typography>

      {/* Details Card */}
      {trip.status === "PLANNED" && canReschedule && (
        <PlannedDispatchEditor trip={trip} />
      )}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t("Driver")}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {trip.driverName ?? "—"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t("Helper")}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {trip.helperName ?? "None"}
            </Typography>
          </Box>
          {trip.departedAt && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t("Departed")}
              </Typography>
              <Typography variant="body2">
                {formatDate(new Date(trip.departedAt), undefined, { dateStyle: "medium", timeStyle: "short" })}
              </Typography>
            </Box>
          )}
          {trip.completedAt && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t("Completed")}</Typography>
              <Typography variant="body2">
                {formatDate(new Date(trip.completedAt), undefined, { dateStyle: "medium", timeStyle: "short" })}
              </Typography>
            </Box>
          )}
          {trip.notes && (
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">
                {t("Notes")}</Typography>
              <Typography variant="body2">{trip.notes}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {canManage && (
        <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
          {isPlanned && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={handleDispatch}
              >
                {t("Dispatch Trip")}
              </Button>
              <Button color="error" onClick={handleCancel}>
                {t("Cancel Trip")}
              </Button>
            </>
          )}
          {isDispatched && (
            <Button
              variant="contained"
              color="success"
              onClick={handleComplete}
            >
              {t("Complete & Reconcile Trip")}
            </Button>
          )}
        </Box>
      )}

      {/* Interactive Route Map */}
      <DeliveryRouteMap trip={trip} orders={orders} />

      {/* Assigned Delivery Orders */}
      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            {t("Delivery Orders (")}{orders.length}{" "}
            {t(orders.length === 1 ? "stop" : "stops")})
          </Typography>
        </Box>

        {orders.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t("No delivery orders assigned to this trip yet.")}
          </Typography>
        )}

        {orders.map((order) => (
          <Accordion
            key={order.id}
            defaultExpanded
            sx={{
              mb: 1.5,
              border: "1px solid",
              borderColor: "divider",
              "&::before": { display: "none" },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                <Chip
                  label={t("Stop #{sequence}", undefined, {
                    sequence: formatNumber(order.stopSequence),
                  })}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="subtitle2">
                  {order.deliveryOrderNumber ?? "Draft DO"} {t("(SO:")} {order.salesOrderNumber ?? "—"})
                </Typography>
                <Chip
                  label={localizeDisplayCode(order.status)}
                  size="small"
                  color={
                    order.status === "DELIVERED"
                      ? "success"
                      : order.status === "IN_TRANSIT"
                        ? "primary"
                        : order.status === "FAILED"
                          ? "error"
                          : "default"
                  }
                />
                <Chip
                  label={
                    order.preInspectionPassed
                      ? t("Inspected ✓")
                      : t("Inspection Pending ⚠️")
                  }
                  size="small"
                  color={order.preInspectionPassed ? "success" : "warning"}
                  variant="outlined"
                />
                {order.codAmount > 0 && (
                  <Typography variant="caption" sx={{ ml: "auto", mr: 2 }}>
                    {t("COD:")} {formatNumber(order.codAmount)} {t("(Paid:")}{" "}
                    {formatNumber(order.codCollected)})
                  </Typography>
                )}
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t("Recipient:")}{order.recipientName ?? "—"} {t("· Phone:")} {order.recipientPhone ?? "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t("Address:")} {order.destinationAddress}
              </Typography>
              {order.deliveryWindow && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t("Delivery window:")}{order.deliveryWindow === "MORNING" ? "09:00–12:00" : "12:00–17:00"} {t("WIB")}
                </Typography>
              )}

              {order.deliveredAt && (
                <Typography variant="caption" color="success.main" sx={{ display: "block" }}>
                  {t("Delivered on")} {formatDate(new Date(order.deliveredAt), undefined, { dateStyle: "medium", timeStyle: "short" })} {t("(Signed by:")} {order.signedBy})
                </Typography>
              )}
              {order.failureReason && (
                <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
                  {t("Failed:")}{order.failureReason}
                </Typography>
              )}

              <Divider sx={{ my: 1 }} />

              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t("Items (")}{order.items.length}):
              </Typography>
              <List dense disablePadding>
                {order.items.map((item) => (
                  <ListItem key={item.id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={`${item.productName ?? "Item"} — ${item.variantName ?? ""} (SKU: ${item.sku ?? "—"})`}
                      secondary={`Serial: ${item.manufacturerSerial ?? "—"} · Status: ${item.status}`}
                    />
                  </ListItem>
                ))}
              </List>

              {canManage && (
                <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                  {isPlanned && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setActiveInspectionOrder(order)}
                    >
                      {t("Pre-Inspection")}
                    </Button>
                  )}
                  {(order.status === "IN_TRANSIT" || (isPlanned && order.status === "PENDING")) && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => setActiveDeliverOrder(order)}
                      >
                        {t("Mark Delivered")}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => setActiveFailOrder(order)}
                      >
                        {t("Mark Failed")}
                      </Button>
                    </>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Inspection Modal */}
      {activeInspectionOrder && (
        <PreInspectionDialog
          order={activeInspectionOrder}
          tripId={id}
          onClose={() => setActiveInspectionOrder(null)}
        />
      )}

      {/* Delivered Modal */}
      {activeDeliverOrder && (
        <DeliverOrderDialog
          order={activeDeliverOrder}
          tripId={id}
          onClose={() => setActiveDeliverOrder(null)}
        />
      )}

      {/* Failed Modal */}
      {activeFailOrder && (
        <FailOrderDialog
          order={activeFailOrder}
          tripId={id}
          onClose={() => setActiveFailOrder(null)}
        />
      )}
    </Box>
  );
}
