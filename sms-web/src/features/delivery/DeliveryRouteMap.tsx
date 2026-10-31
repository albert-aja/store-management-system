import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, LinearProgress, List, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import type { DeliveryOrder, DeliveryTrip } from "./types";
import { formatNumber , localizeDisplayCode, t} from "../../lib/locale";

interface DeliveryRouteMapProps {
  trip: DeliveryTrip;
  orders: DeliveryOrder[];
  onSelectOrder?: (order: DeliveryOrder) => void;
}

export default function DeliveryRouteMap({ trip, orders, onSelectOrder }: DeliveryRouteMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(orders[0]?.id ?? null);
  const selected = orders.find((order) => order.id === selectedId);
  const delivered = orders.filter((order) => order.status === "DELIVERED").length;
  const resolved = orders.filter((order) => order.status === "DELIVERED" || order.status === "FAILED").length;
  const progress = orders.length ? Math.round(resolved / orders.length * 100) : 0;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" useFlexGap sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Box>
            <Typography variant="h6">{t("Delivery stops")}</Typography>
            <Typography variant="body2" color="text.secondary">{trip.storeName ?? "Warehouse"} / {trip.tripNumber}</Typography>
          </Box>
          <Chip
            label={t("{delivered}/{total} Completed", undefined, {
              delivered: formatNumber(delivered),
              total: formatNumber(orders.length),
            })}
            variant="outlined"
            size="small"
          />
        </Stack>
        <LinearProgress variant="determinate" value={progress} aria-label={t("Resolved delivery stops")} sx={{ mb: 2, height: 6, borderRadius: 1 }} />
        <Alert severity="info" sx={{ mb: 2 }}>{t("Stop sequence only. Delivery addresses have no GPS coordinates yet, so street routes, distances, and travel times are unavailable.")}</Alert>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 2 }}>
          <List disablePadding aria-label={t("Delivery stops")} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            {orders.map((order, index) => (
              <ListItemButton key={order.id} selected={selectedId === order.id} onClick={() => {
                setSelectedId(order.id);
                onSelectOrder?.(order);
              }} sx={{ gap: 2, borderBottom: index < orders.length - 1 ? 1 : 0, borderColor: "divider", py: 1.5 }}>
                <Box sx={{ width: 32, height: 32, display: "grid", placeItems: "center", bgcolor: "action.selected", borderRadius: 1, flexShrink: 0 }}>
                  {order.stopSequence || index + 1}
                </Box>
                <ListItemText primary={order.recipientName ?? "Delivery order"} secondary={order.destinationAddress || "Address not recorded"} />
                <Chip label={localizeDisplayCode(order.status)} size="small" color={order.status === "DELIVERED" ? "success" : order.status === "FAILED" ? "error" : "default"} />
              </ListItemButton>
            ))}
            {!orders.length && <Typography color="text.secondary" sx={{ p: 3 }}>{t("No delivery stops.")}</Typography>}
          </List>
          <Box sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1.5, minWidth: 0 }}>
            {selected ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1">{selected.deliveryOrderNumber ?? "Delivery Order"}</Typography>
                <Box><Typography variant="caption" color="text.secondary">{t("Recipient & contact")}</Typography>
                  <Typography variant="body2">{selected.recipientName ?? "Not recorded"}</Typography>
                  <Typography variant="body2" color="text.secondary">{selected.recipientPhone ?? "Phone not recorded"}</Typography>
                </Box>
                <Box><Typography variant="caption" color="text.secondary">{t("Delivery destination")}</Typography>
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{selected.destinationAddress || "No delivery address recorded"}</Typography>
                </Box>
                {selected.codAmount > 0 && <Alert severity="warning">{t("COD collectible: Rp")} {formatNumber(selected.codAmount)}</Alert>}
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.open(
                  `/api/documents/print/surat-jalan/${selected.id}`, "_blank", "noopener,noreferrer",
                )}>{t("Print Delivery Order (Surat Jalan)")}</Button>
              </Stack>
            ) : <Typography variant="body2" color="text.secondary">{t("Select a stop to view delivery details.")}</Typography>}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
