import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSnackbar } from "notistack";
import { useAllocations } from "../inventory/hooks";
import type { SalesOrderItem } from "../salesOrders/types";
import {
  useCreateDeliveryOrder,
  useDeliveryOrdersBySalesOrder,
  useDeliveryTrips,
} from "./hooks";

interface DeliveryOrderPanelProps {
  salesOrderId: string;
  storeId: string;
  deliveryAddressSnapshot: string | null;
  items: SalesOrderItem[];
  isReleasedOrConfirmed: boolean;
}

function NewDeliveryOrderDialog({
  salesOrderId,
  storeId,
  defaultAddress,
  items,
  onClose,
}: {
  salesOrderId: string;
  storeId: string;
  defaultAddress: string | null;
  items: SalesOrderItem[];
  onClose: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: trips = [] } = useDeliveryTrips({
    storeId,
    status: "PLANNED",
  });
  const createOrder = useCreateDeliveryOrder(salesOrderId);

  const [tripId, setTripId] = useState("");
  const [destination, setDestination] = useState(defaultAddress ?? "");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [codAmount, setCodAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAllocationIds, setSelectedAllocationIds] = useState<string[]>(
    [],
  );

  // Collect all active allocations across items
  // Helper to query each item
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Outbound Delivery Order (Surat Jalan)</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Assign allocated physical items to a delivery run. Partial delivery and
          multiple trips are supported (README 11.2).
        </Typography>

        <TextField
          select
          label="Assign to Trip (Optional)"
          size="small"
          fullWidth
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
        >
          <MenuItem value="">Unassigned (Standalone)</MenuItem>
          {trips.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.tripNumber} ({t.driverName ?? "Driver"}, {t.scheduledDate})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Destination Address"
          required
          size="small"
          fullWidth
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            label="Recipient Name"
            size="small"
            fullWidth
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <TextField
            label="Recipient Phone"
            size="small"
            fullWidth
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
          />
        </Box>

        <TextField
          label="COD Amount to Collect"
          type="number"
          size="small"
          fullWidth
          value={codAmount}
          onChange={(e) => setCodAmount(e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }}
        />

        <TextField
          label="Delivery Instructions / Notes"
          size="small"
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Divider sx={{ my: 0.5 }} />

        <Typography variant="subtitle2">
          Select Items & Allocations to Deliver:
        </Typography>

        {items.map((item) => (
          <ItemAllocationsSelector
            key={item.id}
            item={item}
            selectedIds={selectedAllocationIds}
            onToggle={(allocId) =>
              setSelectedAllocationIds((prev) =>
                prev.includes(allocId)
                  ? prev.filter((id) => id !== allocId)
                  : [...prev, allocId],
              )
            }
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!destination || selectedAllocationIds.length === 0}
          onClick={() => {
            createOrder.mutate(
              {
                salesOrderId,
                deliveryTripId: tripId || undefined,
                destinationAddress: destination,
                recipientName: recipientName || undefined,
                recipientPhone: recipientPhone || undefined,
                codAmount: codAmount ? parseFloat(codAmount) : undefined,
                notes: notes || undefined,
                soItemStockUnitIds: selectedAllocationIds,
              },
              {
                onSuccess: () => {
                  enqueueSnackbar("Delivery order created", {
                    variant: "success",
                  });
                  onClose();
                },
                onError: (err) =>
                  enqueueSnackbar(
                    err instanceof Error ? err.message : "Failed to create DO",
                    { variant: "error" },
                  ),
              },
            );
          }}
        >
          Create Delivery Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ItemAllocationsSelector({
  item,
  selectedIds,
  onToggle,
}: {
  item: SalesOrderItem;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const { data: allocations = [] } = useAllocations(item.id);
  const activeAllocations = allocations.filter((a) => !a.releasedAt);

  if (activeAllocations.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
        • {item.productVariantId ? "Variant Item" : "Component"} (No physical units allocated yet)
      </Typography>
    );
  }

  return (
    <Box sx={{ pl: 1, mb: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        Ordered: x{item.quantity} units
      </Typography>
      <List dense disablePadding>
        {activeAllocations.map((a) => {
          const isSelected = selectedIds.includes(a.id);
          return (
            <ListItemButton
              key={a.id}
              dense
              onClick={() => onToggle(a.id)}
              sx={{
                bgcolor: isSelected ? "action.selected" : "transparent",
                borderRadius: 1,
              }}
            >
              <ListItemText
                primary={`Stock Unit: ${a.stockUnitId.slice(0, 8)}`}
                secondary={isSelected ? "✓ Selected for this delivery" : "Click to select"}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export default function DeliveryOrderPanel({
  salesOrderId,
  storeId,
  deliveryAddressSnapshot,
  items,
  isReleasedOrConfirmed,
}: DeliveryOrderPanelProps) {
  const { data: deliveryOrders = [] } =
    useDeliveryOrdersBySalesOrder(salesOrderId);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography variant="subtitle1">
          Deliveries & Outbound ({deliveryOrders.length})
        </Typography>
        {isReleasedOrConfirmed && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setDialogOpen(true)}
          >
            + Create Delivery Order
          </Button>
        )}
      </Box>

      {deliveryOrders.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No delivery orders created for this Sales Order yet.
        </Typography>
      )}

      {deliveryOrders.map((order) => (
        <Accordion
          key={order.id}
          sx={{
            mb: 1,
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
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {order.deliveryOrderNumber ?? "Draft DO"}
              </Typography>
              {order.tripNumber && (
                <Chip
                  label={`Trip: ${order.tripNumber}`}
                  size="small"
                  variant="outlined"
                />
              )}
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
              {order.deliveredAt && (
                <Typography variant="caption" color="success.main">
                  Delivered {new Date(order.deliveredAt).toLocaleDateString()}
                </Typography>
              )}
              {order.failureReason && (
                <Typography variant="caption" color="error.main">
                  Failed: {order.failureReason}
                </Typography>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              Destination: {order.destinationAddress}
            </Typography>
            {order.recipientName && (
              <Typography variant="body2" color="text.secondary">
                Recipient: {order.recipientName} ({order.recipientPhone ?? "—"})
              </Typography>
            )}
            {order.signedBy && (
              <Typography variant="body2" color="text.secondary">
                Signed by: <strong>{order.signedBy}</strong>
              </Typography>
            )}
            {order.codAmount > 0 && (
              <Typography variant="body2" color="text.secondary">
                COD: {order.codAmount.toLocaleString()} · Collected:{" "}
                {order.codCollected.toLocaleString()}
              </Typography>
            )}

            <Divider sx={{ my: 1 }} />

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Items ({order.items.length}):
            </Typography>
            <List dense disablePadding>
              {order.items.map((item) => (
                <ListItem key={item.id} disablePadding sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={`${item.productName ?? "Item"} ${item.variantName ?? ""}`}
                    secondary={`Serial: ${item.manufacturerSerial ?? "—"} · Status: ${item.status}`}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {dialogOpen && (
        <NewDeliveryOrderDialog
          salesOrderId={salesOrderId}
          storeId={storeId}
          defaultAddress={deliveryAddressSnapshot}
          items={items}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </Paper>
  );
}
