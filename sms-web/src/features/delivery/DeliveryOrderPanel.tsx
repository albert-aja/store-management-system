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
import {
  formatCurrency,
  formatDate,
  formatNumber,
  localizeDisplayCode,
  t,
  useLanguage,
} from "../../lib/locale";

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
  const language = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const { data: trips = [] } = useDeliveryTrips({
    storeId,
    status: "PLANNED",
  });
  const createOrder = useCreateDeliveryOrder(salesOrderId);

  const [tripId, setTripId] = useState("");
  const [destination, setDestination] = useState(defaultAddress ?? "");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const hasCoordinates = latitude.trim() !== "" || longitude.trim() !== "";
  const coordinatesValid = !hasCoordinates || (
    latitude.trim() !== "" && longitude.trim() !== "" &&
    Number.isFinite(Number(latitude)) && Math.abs(Number(latitude)) <= 90 &&
    Number.isFinite(Number(longitude)) && Math.abs(Number(longitude)) <= 180
  );
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
      <DialogTitle>{t("Create Outbound Delivery Order (Surat Jalan)", language)}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t("Assign allocated physical items to a delivery run. Partial delivery and multiple trips are supported (README 11.2).", language)}
        </Typography>

        <TextField
          select
          label={t("Assign to Trip (Optional)", language)}
          size="small"
          fullWidth
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
        >
          <MenuItem value="">{t("Unassigned (Standalone)", language)}</MenuItem>
          {trips.map((trip) => (
            <MenuItem key={trip.id} value={trip.id}>
              {trip.tripNumber} ({trip.driverName ?? t("Driver", language)},{" "}
              {trip.scheduledDate ? formatDate(trip.scheduledDate, language) : "—"})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label={t("Destination Address", language)}
          required
          size="small"
          fullWidth
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            label={t("Destination Latitude", language)}
            type="number"
            size="small"
            fullWidth
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            error={!coordinatesValid}
            helperText={t("Optional GPS pair: -90 to 90", language)}
            slotProps={{ htmlInput: { min: -90, max: 90, step: "any" } }}
          />
          <TextField
            label={t("Destination Longitude", language)}
            type="number"
            size="small"
            fullWidth
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            error={!coordinatesValid}
            helperText={t("Optional GPS pair: -180 to 180", language)}
            slotProps={{ htmlInput: { min: -180, max: 180, step: "any" } }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {t("Use verified customer destination coordinates. Drivers can share this destination with their chosen navigation app; customer details are not sent.", language)}
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            label={t("Recipient Name", language)}
            size="small"
            fullWidth
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <TextField
            label={t("Recipient Phone", language)}
            size="small"
            fullWidth
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
          />
        </Box>

        <TextField
          label={t("COD Amount to Collect", language)}
          type="number"
          size="small"
          fullWidth
          value={codAmount}
          onChange={(e) => setCodAmount(e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }}
        />

        <TextField
          label={t("Delivery Instructions / Notes", language)}
          size="small"
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Divider sx={{ my: 0.5 }} />

        <Typography variant="subtitle2">
          {t("Select Items & Allocations to Deliver:", language)}
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
        <Button onClick={onClose}>{t("Cancel", language)}</Button>
        <Button
          variant="contained"
          disabled={!destination || selectedAllocationIds.length === 0 || !coordinatesValid || createOrder.isPending}
          onClick={() => {
            createOrder.mutate(
              {
                salesOrderId,
                deliveryTripId: tripId || undefined,
                destinationAddress: destination,
                destinationLatitude: hasCoordinates ? Number(latitude) : undefined,
                destinationLongitude: hasCoordinates ? Number(longitude) : undefined,
                recipientName: recipientName || undefined,
                recipientPhone: recipientPhone || undefined,
                codAmount: codAmount ? parseFloat(codAmount) : undefined,
                notes: notes || undefined,
                soItemStockUnitIds: selectedAllocationIds,
              },
              {
                onSuccess: () => {
                  enqueueSnackbar(t("Delivery order created", language), {
                    variant: "success",
                  });
                  onClose();
                },
                onError: (err) =>
                  enqueueSnackbar(
                    err instanceof Error ? err.message : t("Failed to create DO", language),
                    { variant: "error" },
                  ),
              },
            );
          }}
        >
          {t("Create Delivery Order", language)}
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
  const language = useLanguage();
  const { data: allocations = [] } = useAllocations(item.id);
  const activeAllocations = allocations.filter((a) => !a.releasedAt);

  if (activeAllocations.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
        • {t(item.productVariantId ? "Variant Item" : "Component", language)} ({t("No physical units allocated yet", language)})
      </Typography>
    );
  }

  return (
    <Box sx={{ pl: 1, mb: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {t("Ordered: x", language)}{formatNumber(item.quantity, language)} {t("units", language)}
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
                primary={`${t("Stock Unit:", language)} ${a.stockUnitId.slice(0, 8)}`}
                secondary={isSelected ? `✓ ${t("Selected for this delivery", language)}` : t("Click to select", language)}
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
  const language = useLanguage();
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
          {t("Deliveries & Outbound", language)} ({formatNumber(deliveryOrders.length, language)})
        </Typography>
        {isReleasedOrConfirmed && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setDialogOpen(true)}
          >
            + {t("Create Delivery Order", language)}
          </Button>
        )}
      </Box>

      {deliveryOrders.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t("No delivery orders created for this Sales Order yet.", language)}
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
                {order.deliveryOrderNumber ?? t("Draft DO", language)}
              </Typography>
              {order.tripNumber && (
                <Chip
                  label={`${t("Trip:", language)} ${order.tripNumber}`}
                  size="small"
                  variant="outlined"
                />
              )}
              <Chip
                label={localizeDisplayCode(order.status, language)}
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
                  {t("Delivered", language)} {formatDate(order.deliveredAt, language)}
                </Typography>
              )}
              {order.failureReason && (
                <Typography variant="caption" color="error.main">
                  {t("Failed:", language)} {order.failureReason}
                </Typography>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              {t("Destination:", language)} {order.destinationAddress}
            </Typography>
            {order.destinationLatitude != null && order.destinationLongitude != null && (
              <Typography variant="body2" color="text.secondary">
                {t("GPS:", language)} {order.destinationLatitude}, {order.destinationLongitude}
              </Typography>
            )}
            {order.deliveryWindow && (
              <Typography variant="body2" color="text.secondary">
                {t("Delivery window:", language)} {order.deliveryWindow === "MORNING" ? "09:00–12:00" : "12:00–17:00"} {t("WIB")}
              </Typography>
            )}
            {order.recipientName && (
              <Typography variant="body2" color="text.secondary">
                {t("Recipient:", language)} {order.recipientName} ({order.recipientPhone ?? "—"})
              </Typography>
            )}
            {order.signedBy && (
              <Typography variant="body2" color="text.secondary">
                {t("Signed by:", language)} <strong>{order.signedBy}</strong>
              </Typography>
            )}
            {order.codAmount > 0 && (
              <Typography variant="body2" color="text.secondary">
                {t("COD:", language)} {formatCurrency(order.codAmount, language)} · {t("Collected:", language)}{" "}
                {formatCurrency(order.codCollected, language)}
              </Typography>
            )}

            <Divider sx={{ my: 1 }} />

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t("Items (", language)}{formatNumber(order.items.length, language)}):
            </Typography>
            <List dense disablePadding>
              {order.items.map((item) => (
                <ListItem key={item.id} disablePadding sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={`${item.productName ?? t("Item", language)} ${item.variantName ?? ""}`}
                    secondary={`${t("Serial:", language)} ${item.manufacturerSerial ?? "—"} · ${t("Status", language)}: ${localizeDisplayCode(item.status, language)}`}
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
