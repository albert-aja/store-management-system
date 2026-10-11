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
          enqueueSnackbar("Pre-delivery inspection updated", {
            variant: "success",
          });
          onClose();
        },
        onError: () =>
          enqueueSnackbar("Failed to update pre-inspection", {
            variant: "error",
          }),
      },
    );
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Pre-Delivery Inspection</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Verify product completeness, condition, and packaging with the driver
          before departure (README 11.1).
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={passed}
              onChange={(e) => setPassed(e.target.checked)}
            />
          }
          label={passed ? "Inspection Passed (Ready to Load)" : "Inspection Failed"}
        />
        <TextField
          label="Inspection Notes / Checklist"
          multiline
          rows={2}
          size="small"
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Inspection
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
          enqueueSnackbar("Delivery marked as completed and inventory updated", {
            variant: "success",
          });
          onClose();
        },
        onError: () =>
          enqueueSnackbar("Failed to record delivery", { variant: "error" }),
      },
    );
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Confirm Customer Delivery & Acceptance</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Customer inspects and signs confirmation upon acceptance. This
          officially moves stock units to the customer (README 11.1, 11.2).
        </Typography>

        <TextField
          label="Customer / Recipient Signature Name"
          required
          size="small"
          fullWidth
          value={signedBy}
          onChange={(e) => setSignedBy(e.target.value)}
        />

        <TextField
          label="Proof of Delivery / Photo URL"
          size="small"
          fullWidth
          placeholder="https://..."
          value={proofPhotoUrl}
          onChange={(e) => setProofPhotoUrl(e.target.value)}
        />

        {order.codAmount > 0 && (
          <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              COD Amount to Collect: {order.codAmount.toLocaleString()}
            </Typography>
            <TextField
              label="COD Collected"
              type="number"
              size="small"
              fullWidth
              value={codCollected}
              onChange={(e) => setCodCollected(e.target.value)}
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              label="COD Custody Notes"
              size="small"
              fullWidth
              sx={{ mt: 1 }}
              value={codNotes}
              onChange={(e) => setCodNotes(e.target.value)}
            />
          </Box>
        )}

        <TextField
          label="Installation / Verification Notes"
          multiline
          rows={2}
          size="small"
          fullWidth
          placeholder="Product condition, installation, basic functionality verified"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!signedBy}
          onClick={handleComplete}
        >
          Confirm Delivery
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
          enqueueSnackbar("Delivery marked as failed for rescheduling", {
            variant: "warning",
          });
          onClose();
        },
        onError: () =>
          enqueueSnackbar("Failed to record failure", { variant: "error" }),
      },
    );
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record Failed Delivery</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Record why delivery could not be completed. Stock allocation remains
          for rescheduling (README 11.1).
        </Typography>

        <TextField
          label="Failure / Rejection Reason"
          required
          size="small"
          fullWidth
          placeholder="e.g. Customer absent, address unreachable, customer rejected"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <TextField
          label="Additional Details / Notes"
          multiline
          rows={2}
          size="small"
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          disabled={!reason}
          onClick={handleFail}
        >
          Record Failure
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
      enqueueSnackbar("Assign at least one delivery order before dispatching", {
        variant: "warning",
      });
      return;
    }
    const uninspected = orders.filter((o) => !o.preInspectionPassed);
    if (uninspected.length > 0) {
      enqueueSnackbar(
        `Pre-delivery inspection pending for ${uninspected.length} order(s)`,
        { variant: "warning" },
      );
      return;
    }
    dispatchTrip.mutate(undefined, {
      onSuccess: () =>
        enqueueSnackbar("Trip dispatched — goods in transit", {
          variant: "success",
        }),
      onError: (err) =>
        enqueueSnackbar(
          err instanceof Error ? err.message : "Failed to dispatch trip",
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
        `${pendingOrders.length} order(s) still open. Complete or fail all orders first.`,
        { variant: "warning" },
      );
      return;
    }
    const notes = window.prompt("Reconciliation notes (goods return, COD custody handover):");
    completeTrip.mutate(notes ?? undefined, {
      onSuccess: () =>
        enqueueSnackbar("Trip completed and reconciled", {
          variant: "success",
        }),
      onError: () =>
        enqueueSnackbar("Failed to complete trip", { variant: "error" }),
    });
  };

  const handleCancel = () => {
    const reason = window.prompt("Reason for cancelling trip?");
    if (reason !== null) {
      cancelTrip.mutate(reason || undefined, {
        onSuccess: () =>
          enqueueSnackbar("Trip cancelled", { variant: "info" }),
        onError: () =>
          enqueueSnackbar("Failed to cancel trip", { variant: "error" }),
      });
    }
  };

  return (
    <Box>
      {/* Trip Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography variant="h5">{trip.tripNumber}</Typography>
        <Chip
          label={trip.status}
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
        Store: {trip.storeName ?? "—"} · Scheduled: {trip.scheduledDate}
        {trip.vehiclePlate ? ` · Vehicle: ${trip.vehiclePlate}` : ""}
      </Typography>

      {/* Details Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Driver
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {trip.driverName ?? "—"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Helper
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {trip.helperName ?? "None"}
            </Typography>
          </Box>
          {trip.departedAt && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Departed
              </Typography>
              <Typography variant="body2">
                {new Date(trip.departedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
          {trip.completedAt && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
              <Typography variant="body2">
                {new Date(trip.completedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
          {trip.notes && (
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">
                Notes
              </Typography>
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
                Dispatch Trip
              </Button>
              <Button color="error" onClick={handleCancel}>
                Cancel Trip
              </Button>
            </>
          )}
          {isDispatched && (
            <Button
              variant="contained"
              color="success"
              onClick={handleComplete}
            >
              Complete & Reconcile Trip
            </Button>
          )}
        </Box>
      )}

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
            Delivery Orders ({orders.length} stop{orders.length !== 1 ? "s" : ""})
          </Typography>
        </Box>

        {orders.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No delivery orders assigned to this trip yet.
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
                  label={`Stop #${order.stopSequence}`}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="subtitle2">
                  {order.deliveryOrderNumber ?? "Draft DO"} (SO: {order.salesOrderNumber ?? "—"})
                </Typography>
                <Chip
                  label={order.status}
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
                      ? "Inspected ✓"
                      : "Inspection Pending ⚠️"
                  }
                  size="small"
                  color={order.preInspectionPassed ? "success" : "warning"}
                  variant="outlined"
                />
                {order.codAmount > 0 && (
                  <Typography variant="caption" sx={{ ml: "auto", mr: 2 }}>
                    COD: {order.codAmount.toLocaleString()} (Paid:{" "}
                    {order.codCollected.toLocaleString()})
                  </Typography>
                )}
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Recipient: {order.recipientName ?? "—"} · Phone: {order.recipientPhone ?? "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Address: {order.destinationAddress}
              </Typography>

              {order.deliveredAt && (
                <Typography variant="caption" color="success.main" sx={{ display: "block" }}>
                  Delivered on {new Date(order.deliveredAt).toLocaleString()} (Signed by: {order.signedBy})
                </Typography>
              )}
              {order.failureReason && (
                <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
                  Failed: {order.failureReason}
                </Typography>
              )}

              <Divider sx={{ my: 1 }} />

              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Items ({order.items.length}):
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
                      Pre-Inspection
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
                        Mark Delivered
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => setActiveFailOrder(order)}
                      >
                        Mark Failed
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
