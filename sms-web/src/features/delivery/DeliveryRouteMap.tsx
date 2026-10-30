import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StoreIcon from "@mui/icons-material/Store";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PrintIcon from "@mui/icons-material/Print";
import NavigationIcon from "@mui/icons-material/Navigation";
import type { DeliveryOrder, DeliveryTrip } from "./types";

interface DeliveryRouteMapProps {
  trip: DeliveryTrip;
  orders: DeliveryOrder[];
  onSelectOrder?: (order: DeliveryOrder) => void;
}

export default function DeliveryRouteMap({
  trip,
  orders,
  onSelectOrder,
}: DeliveryRouteMapProps) {
  const theme = useTheme();
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(
    orders.length > 0 ? 0 : null,
  );

  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const failedCount = orders.filter((o) => o.status === "FAILED").length;
  const progressPct =
    orders.length > 0
      ? Math.round(((deliveredCount + failedCount) / orders.length) * 100)
      : 0;

  // Approximate simulated distance and transit times based on stop count
  const estimatedKm = (orders.length * 8.5).toFixed(1);
  const estimatedMinutes = orders.length * 25;

  const selectedOrder =
    selectedStopIndex !== null ? orders[selectedStopIndex] : null;

  return (
    <Card sx={{ mb: 3, overflow: "hidden" }}>
      <CardContent sx={{ pb: 1 }}>
        {/* Header & Metrics */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <NavigationIcon color="primary" />
            <Typography variant="h6">Interactive Delivery Route & Waypoints</Typography>
            <Chip
              label={`${deliveredCount}/${orders.length} Completed`}
              size="small"
              color={progressPct === 100 ? "success" : "default"}
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", gap: 2, alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Est. Duration: <strong>~{estimatedMinutes} mins</strong>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocalShippingIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Est. Distance: <strong>~{estimatedKm} km</strong>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 3,
                backgroundColor:
                  progressPct === 100
                    ? theme.palette.success.main
                    : theme.palette.primary.main,
              },
            }}
          />
        </Box>

        {/* Route Visualizer Layout */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 340px" },
            gap: 2,
          }}
        >
          {/* SVG Route Waypoint Map Track */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              position: "relative",
              minHeight: 280,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              backgroundColor:
                theme.palette.mode === "dark" ? "#0d131f" : "#f1f5f9",
              borderRadius: 2,
            }}
          >
            {/* Horizontal Timeline Track */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                overflowX: "auto",
                py: 3,
                px: 2,
                gap: 2,
              }}
            >
              {/* Origin Hub */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 80,
                  cursor: "default",
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.palette.primary.main,
                    color: "#ffffff",
                    boxShadow: 2,
                  }}
                >
                  <StoreIcon fontSize="small" />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ mt: 1, textAlign: "center", fontWeight: 600 }}
                >
                  {trip.storeName ?? "Warehouse"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Origin Hub
                </Typography>
              </Box>

              {/* Waypoints */}
              {orders.map((order, idx) => {
                const isSelected = selectedStopIndex === idx;
                const isDelivered = order.status === "DELIVERED";
                const isFailed = order.status === "FAILED";

                let iconColor = theme.palette.text.secondary;
                let bgColor = theme.palette.action.selected;

                if (isDelivered) {
                  iconColor = "#ffffff";
                  bgColor = theme.palette.success.main;
                } else if (isFailed) {
                  iconColor = "#ffffff";
                  bgColor = theme.palette.error.main;
                } else if (isSelected) {
                  iconColor = "#ffffff";
                  bgColor = theme.palette.primary.main;
                }

                return (
                  <Box
                    key={order.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    {/* Connecting Line */}
                    <Box
                      sx={{
                        width: { xs: 30, sm: 50 },
                        height: 3,
                        backgroundColor: isDelivered
                          ? theme.palette.success.main
                          : isFailed
                          ? theme.palette.error.main
                          : theme.palette.divider,
                        borderRadius: 1,
                      }}
                    />

                    {/* Stop Pin */}
                    <Box
                      onClick={() => {
                        setSelectedStopIndex(idx);
                        onSelectOrder?.(order);
                      }}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: 90,
                        cursor: "pointer",
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      <Tooltip
                        title={`${order.recipientName ?? "Customer"} — ${order.destinationAddress || "No Address"}`}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: bgColor,
                            color: iconColor,
                            boxShadow: isSelected ? 4 : 1,
                            border: isSelected
                              ? `3px solid ${theme.palette.secondary.main}`
                              : "none",
                          }}
                        >
                          {isDelivered ? (
                            <CheckCircleIcon fontSize="small" />
                          ) : isFailed ? (
                            <ErrorIcon fontSize="small" />
                          ) : (
                            <LocationOnIcon fontSize="small" />
                          )}
                        </Box>
                      </Tooltip>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{
                          mt: 1,
                          textAlign: "center",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "primary.main" : "text.primary",
                        }}
                      >
                        Stop #{idx + 1}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ maxWidth: 90, textAlign: "center" }}
                        noWrap
                      >
                        {order.recipientName ?? "Order"}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 3,
                mt: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.success.main,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Delivered
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.primary.main,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  In Transit / Pending
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.error.main,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Failed
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Selected Waypoint Detail Card */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: 2,
            }}
          >
            {selectedOrder ? (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Selected Waypoint #{selectedStopIndex !== null ? selectedStopIndex + 1 : 1}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {selectedOrder.deliveryOrderNumber ?? "Delivery Order"}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedOrder.status}
                    size="small"
                    color={
                      selectedOrder.status === "DELIVERED"
                        ? "success"
                        : selectedOrder.status === "FAILED"
                        ? "error"
                        : "default"
                    }
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="caption" color="text.secondary">
                  Recipient & Contact
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedOrder.recipientName ?? "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Phone: {selectedOrder.recipientPhone ?? "—"}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Delivery Destination
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.03)",
                    fontSize: "0.8rem",
                  }}
                >
                  {selectedOrder.destinationAddress || "No delivery address recorded"}
                </Typography>

                {selectedOrder.codAmount > 0 && (
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "warning.main", fontWeight: 600 }}>
                      COD Collectible: Rp {selectedOrder.codAmount.toLocaleString("id-ID")}
                    </Typography>
                  </Box>
                )}

                {/* Print Surat Jalan shortcut */}
                <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
                  <Tooltip title="Print Official Surat Jalan (PDF / Print View)">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() =>
                        window.open(
                          `/api/documents/print/surat-jalan/${selectedOrder.id}`,
                          "_blank",
                        )
                      }
                      sx={{ border: `1px solid ${theme.palette.divider}` }}
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary">
                    Print Delivery Order (Surat Jalan)
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Select a stop to view customer and delivery address details.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
}
