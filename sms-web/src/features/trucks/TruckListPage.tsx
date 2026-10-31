import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import BuildIcon from "@mui/icons-material/Build";
import BadgeIcon from "@mui/icons-material/Badge";
import { TruckDetailsDialog } from "./TruckDetailsDialog";
import { DriverLicenseDialog } from "./DriverLicenseDialog";
import PersonIcon from "@mui/icons-material/Person";
import EventIcon from "@mui/icons-material/Event";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { useSnackbar } from "notistack";
import { useStores } from "../stores/hooks";
import {
  useTrucks,
  useAvailableDrivers,
  useCreateTruck,
  useUpdateTruck,
  useAssignDriver,
  useUnassignDriver,
  useChangeLicensePlate,
  usePlateHistory,
} from "./hooks";
import type {
  AvailableDriverDto,
  ChangeLicensePlateRequest,
  VehicleDto,
  VehicleType,
} from "../fleet/fleetApi";
import { formatDate, t, useLanguage } from "../../lib/locale";

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "LIGHT_TRUCK_4W", label: "Light Truck 4-Wheel (e.g. Canter / Elf)" },
  { value: "MEDIUM_TRUCK_6W", label: "Medium Truck 6-Wheel (e.g. Fuso / Giga)" },
  { value: "PICKUP_TRUCK", label: "Pickup Truck (e.g. Carry / Gran Max Pick Up)" },
  { value: "BLIND_VAN", label: "Blind Van (e.g. Gran Max Van)" },
  { value: "MOTORCYCLE", label: "Motorcycle (e.g. Honda Beat / Vario)" },
];

export default function TruckListPage() {
  const language = useLanguage();
  const { enqueueSnackbar } = useSnackbar();

  // Filters & State
  const [selectedStoreId, setSelectedStoreId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "TAX_1_MONTH" | "TAX_OVERDUE" | "PLATE_RENEWAL" | "UNASSIGNED">("ALL");

  // Modal states
  const [truckModalOpen, setTruckModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<VehicleDto | null>(null);

  const [plateChangeModalOpen, setPlateChangeModalOpen] = useState(false);
  const [selectedTruckForPlateChange, setSelectedTruckForPlateChange] = useState<VehicleDto | null>(null);

  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [selectedTruckForDriver, setSelectedTruckForDriver] = useState<VehicleDto | null>(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedTruckForHistory, setSelectedTruckForHistory] = useState<VehicleDto | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTruckForDetails, setSelectedTruckForDetails] = useState<VehicleDto | null>(null);

  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [selectedDriverForLicense, setSelectedDriverForLicense] = useState<{ id: string; name: string } | null>(null);

  // Queries
  const { data: stores = [] } = useStores();
  const { data: trucks = [], isLoading: trucksLoading } = useTrucks(
    selectedStoreId !== "ALL" ? { storeId: selectedStoreId } : undefined
  );
  const { data: availableDrivers = [] } = useAvailableDrivers();

  // Mutations
  const createTruckMutation = useCreateTruck();
  const updateTruckMutation = useUpdateTruck();
  const assignDriverMutation = useAssignDriver();
  const unassignDriverMutation = useUnassignDriver();
  const changePlateMutation = useChangeLicensePlate();

  // KPI Calculations
  const stats = useMemo(() => {
    const total = trucks.length;
    let assigned = 0;
    let taxDueIn1Month = 0;
    let taxOverdue = 0;
    let plateRenewalDue = 0;

    trucks.forEach((trk) => {
      if (trk.driverEmployeeId) assigned++;
      if (trk.taxDueStatus === "DUE_IN_ONE_MONTH") taxDueIn1Month++;
      if (trk.taxDueStatus === "OVERDUE") taxOverdue++;
      if (trk.stnkDaysRemaining !== undefined && trk.stnkDaysRemaining <= 30 && trk.stnkDaysRemaining >= 0) {
        plateRenewalDue++;
      }
    });

    return { total, assigned, unassigned: total - assigned, taxDueIn1Month, taxOverdue, plateRenewalDue };
  }, [trucks]);

  // Filtered trucks
  const filteredTrucks = useMemo(() => {
    return trucks.filter((trk) => {
      // Store filter
      if (selectedStoreId !== "ALL" && trk.storeId !== selectedStoreId) return false;

      // Quick filter
      if (activeFilter === "TAX_1_MONTH" && trk.taxDueStatus !== "DUE_IN_ONE_MONTH") return false;
      if (activeFilter === "TAX_OVERDUE" && trk.taxDueStatus !== "OVERDUE") return false;
      if (activeFilter === "PLATE_RENEWAL") {
        const d = trk.stnkDaysRemaining;
        if (d === undefined || d > 30) return false;
      }
      if (activeFilter === "UNASSIGNED" && trk.driverEmployeeId) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const plate = (trk.registrationNumber || "").toLowerCase();
        const brand = (trk.brandModel || "").toLowerCase();
        const driver = (trk.driverName || "").toLowerCase();
        const storeName = (trk.storeName || "").toLowerCase();
        if (!plate.includes(q) && !brand.includes(q) && !driver.includes(q) && !storeName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [trucks, selectedStoreId, activeFilter, searchQuery]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <LocalShippingIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t("Trucks", language)} — Master Data Truck
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Operational truck registry with 1-to-1 driver linking, 1-month STNK tax due date alert & license plate change management.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingTruck(null);
            setTruckModalOpen(true);
          }}
          sx={{ borderRadius: 2, textTransform: "none", px: 2.5, fontWeight: 600 }}
        >
          Add New Truck
        </Button>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }, gap: 2 }}>
        {/* Card 1: Total */}
        <Card
          variant="outlined"
          onClick={() => setActiveFilter("ALL")}
          sx={{
            cursor: "pointer",
            borderRadius: 2,
            borderColor: activeFilter === "ALL" ? "primary.main" : "divider",
            bgcolor: activeFilter === "ALL" ? "action.hover" : "background.paper",
            transition: "all 0.2s",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Total Fleet Trucks
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
              {stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Registered operational vehicles
            </Typography>
          </CardContent>
        </Card>

        {/* Card 2: 1-to-1 Driver Link */}
        <Card
          variant="outlined"
          onClick={() => setActiveFilter("UNASSIGNED")}
          sx={{
            cursor: "pointer",
            borderRadius: 2,
            borderColor: activeFilter === "UNASSIGNED" ? "primary.main" : "divider",
            bgcolor: activeFilter === "UNASSIGNED" ? "action.hover" : "background.paper",
            transition: "all 0.2s",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              1-to-1 Driver Link
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "success.main" }}>
              {stats.assigned} <span style={{ fontSize: "0.85rem", color: "gray" }}>/ {stats.total}</span>
            </Typography>
            <Typography variant="caption" color={stats.unassigned > 0 ? "warning.main" : "text.secondary"}>
              {stats.unassigned > 0 ? `${stats.unassigned} unassigned trucks` : "All trucks have dedicated driver"}
            </Typography>
          </CardContent>
        </Card>

        {/* Card 3: Tax Due in 1 Month */}
        <Card
          variant="outlined"
          onClick={() => setActiveFilter("TAX_1_MONTH")}
          sx={{
            cursor: "pointer",
            borderRadius: 2,
            borderColor: activeFilter === "TAX_1_MONTH" ? "warning.main" : "divider",
            bgcolor: activeFilter === "TAX_1_MONTH" ? "warning.50" : "background.paper",
            transition: "all 0.2s",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Tax Due in 1 Month
              </Typography>
              <WarningAmberIcon fontSize="small" color="warning" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "warning.dark" }}>
              {stats.taxDueIn1Month}
            </Typography>
            <Typography variant="caption" color="warning.dark">
              Pajak STNK 1-thn (≤ 30 hari)
            </Typography>
          </CardContent>
        </Card>

        {/* Card 4: Tax Overdue */}
        <Card
          variant="outlined"
          onClick={() => setActiveFilter("TAX_OVERDUE")}
          sx={{
            cursor: "pointer",
            borderRadius: 2,
            borderColor: activeFilter === "TAX_OVERDUE" ? "error.main" : "divider",
            bgcolor: activeFilter === "TAX_OVERDUE" ? "error.50" : "background.paper",
            transition: "all 0.2s",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" color="error.dark" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Tax Overdue
              </Typography>
              <WarningAmberIcon fontSize="small" color="error" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "error.main" }}>
              {stats.taxOverdue}
            </Typography>
            <Typography variant="caption" color="error.main">
              Pajak lewat tempo (denda Samsat)
            </Typography>
          </CardContent>
        </Card>

        {/* Card 5: Plate Renewal Due */}
        <Card
          variant="outlined"
          onClick={() => setActiveFilter("PLATE_RENEWAL")}
          sx={{
            cursor: "pointer",
            borderRadius: 2,
            borderColor: activeFilter === "PLATE_RENEWAL" ? "info.main" : "divider",
            bgcolor: activeFilter === "PLATE_RENEWAL" ? "info.50" : "background.paper",
            transition: "all 0.2s",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" color="info.dark" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                5-Yr Plate Renewal
              </Typography>
              <EventIcon fontSize="small" color="info" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "info.dark" }}>
              {stats.plateRenewalDue}
            </Typography>
            <Typography variant="caption" color="info.dark">
              Ganti kaleng & STNK 5 tahun
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filter and Search Controls */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flex: 1, minWidth: { xs: "100%", md: 450 } }}>
            <TextField
              size="small"
              placeholder="Search license plate, brand, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1 }}
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Store / Branch</InputLabel>
              <Select
                value={selectedStoreId}
                label="Store / Branch"
                onChange={(e) => setSelectedStoreId(e.target.value)}
              >
                <MenuItem value="ALL">All Stores</MenuItem>
                {stores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            <Chip
              label="All"
              clickable
              color={activeFilter === "ALL" ? "primary" : "default"}
              onClick={() => setActiveFilter("ALL")}
              size="small"
            />
            <Chip
              label={`Tax Due in 1 Mo (${stats.taxDueIn1Month})`}
              clickable
              color={activeFilter === "TAX_1_MONTH" ? "warning" : "default"}
              onClick={() => setActiveFilter("TAX_1_MONTH")}
              size="small"
              icon={<WarningAmberIcon fontSize="small" />}
            />
            <Chip
              label={`Overdue (${stats.taxOverdue})`}
              clickable
              color={activeFilter === "TAX_OVERDUE" ? "error" : "default"}
              onClick={() => setActiveFilter("TAX_OVERDUE")}
              size="small"
            />
            <Chip
              label={`Plate Due (${stats.plateRenewalDue})`}
              clickable
              color={activeFilter === "PLATE_RENEWAL" ? "info" : "default"}
              onClick={() => setActiveFilter("PLATE_RENEWAL")}
              size="small"
            />
            <Chip
              label={`Unassigned Driver (${stats.unassigned})`}
              clickable
              color={activeFilter === "UNASSIGNED" ? "default" : "default"}
              variant={activeFilter === "UNASSIGNED" ? "filled" : "outlined"}
              onClick={() => setActiveFilter("UNASSIGNED")}
              size="small"
            />
          </Stack>
        </Box>
      </Card>

      {/* Main Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: "background.default" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>License Plate</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Truck & Model</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Store</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Assigned Driver (1:1)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                Annual Tax Due Date
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                  Pajak 1 Tahunan (1-Mo Warning)
                </Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                5-Year Plate Expiry
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                  Ganti Plat / Kaleng
                </Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trucksLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading trucks master data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredTrucks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.secondary" }}>
                    No trucks found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery || activeFilter !== "ALL"
                      ? "Try adjusting your search query or filter"
                      : "Add your first operational delivery truck to the registry"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTrucks.map((trk) => {
                const isOverdue = trk.taxDueStatus === "OVERDUE";
                const isDueIn1Month = trk.taxDueStatus === "DUE_IN_ONE_MONTH";
                const isTaxGood = trk.taxDueStatus === "UP_TO_DATE";

                return (
                  <TableRow key={trk.id} hover>
                    {/* License Plate Badge */}
                    <TableCell>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          bgcolor: "#1a1a1a",
                          color: "#fff",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          border: "2px solid #333",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          letterSpacing: 0.5,
                          fontFamily: "monospace",
                        }}
                      >
                        {trk.registrationNumber}
                      </Box>
                    </TableCell>

                    {/* Brand & Model */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {trk.brandModel}
                      </Typography>
                      {trk.maxPayloadKg && (
                        <Typography variant="caption" color="text.secondary">
                          {trk.maxPayloadKg} kg payload
                        </Typography>
                      )}
                    </TableCell>

                    {/* Vehicle Type */}
                    <TableCell>
                      <Chip
                        label={trk.vehicleType.replace(/_/g, " ")}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem", textTransform: "capitalize" }}
                      />
                    </TableCell>

                    {/* Store */}
                    <TableCell>
                      <Typography variant="body2">{trk.storeName || "-"}</Typography>
                    </TableCell>

                    {/* 1-to-1 Driver Assignment */}
                    <TableCell>
                      {trk.driverEmployeeId ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main", fontSize: "0.75rem" }}>
                            {trk.driverName?.charAt(0) || "D"}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {trk.driverName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              1:1 Linked • {trk.driverEmployeeNumber || "Driver"}
                            </Typography>
                          </Box>
                          <Tooltip title="Driver's License (SIM) & Expiry Notifications">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedDriverForLicense({
                                  id: trk.driverEmployeeId!,
                                  name: trk.driverName || "Driver",
                                });
                                setLicenseModalOpen(true);
                              }}
                            >
                              <BadgeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reassign or release driver">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedTruckForDriver(trk);
                                setDriverModalOpen(true);
                              }}
                            >
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            label="Unassigned"
                            size="small"
                            color="default"
                            variant="outlined"
                            sx={{ color: "text.secondary", borderStyle: "dashed" }}
                          />
                          <Tooltip title="Assign dedicated driver (1-to-1)">
                            <Button
                              size="small"
                              startIcon={<PersonAddIcon fontSize="small" />}
                              onClick={() => {
                                setSelectedTruckForDriver(trk);
                                setDriverModalOpen(true);
                              }}
                              sx={{ textTransform: "none", fontSize: "0.75rem" }}
                            >
                              Assign
                            </Button>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>

                    {/* Annual Tax Due Date (Pajak 1 Tahunan) */}
                    <TableCell>
                      {trk.taxDueDate ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatDate(trk.taxDueDate, language)}
                          </Typography>
                          {isOverdue && (
                            <Chip
                              label={`Overdue (${Math.abs(trk.taxDaysRemaining || 0)}d)`}
                              size="small"
                              color="error"
                              sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, mt: 0.5 }}
                            />
                          )}
                          {isDueIn1Month && (
                            <Chip
                              label={`Due in ${trk.taxDaysRemaining}d (1-Mo)`}
                              size="small"
                              color="warning"
                              sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, mt: 0.5 }}
                              icon={<WarningAmberIcon fontSize="inherit" />}
                            />
                          )}
                          {isTaxGood && (
                            <Chip
                              label={`Good (${trk.taxDaysRemaining}d)`}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ height: 20, fontSize: "0.7rem", mt: 0.5 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not recorded
                        </Typography>
                      )}
                    </TableCell>

                    {/* 5-Year Plate Expiry (STNK Exp) */}
                    <TableCell>
                      {trk.stnkExpiryDate ? (
                        <Box>
                          <Typography variant="body2">
                            {formatDate(trk.stnkExpiryDate, language)}
                          </Typography>
                          {trk.stnkDaysRemaining !== undefined && trk.stnkDaysRemaining <= 30 && (
                            <Chip
                              label={trk.stnkDaysRemaining < 0 ? "Plate Expired" : `Plate in ${trk.stnkDaysRemaining}d`}
                              size="small"
                              color={trk.stnkDaysRemaining < 0 ? "error" : "warning"}
                              sx={{ height: 20, fontSize: "0.7rem", mt: 0.5 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not recorded
                        </Typography>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        label={trk.status}
                        size="small"
                        color={
                          trk.status === "AVAILABLE"
                            ? "success"
                            : trk.status === "IN_USE"
                            ? "primary"
                            : trk.status === "MAINTENANCE"
                            ? "warning"
                            : "default"
                        }
                        sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                        <Tooltip title="Change License Plate (Ganti Plat Nomor)">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedTruckForPlateChange(trk);
                              setPlateChangeModalOpen(true);
                            }}
                          >
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Service Logs, Distance & Monthly Inspections">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => {
                              setSelectedTruckForDetails(trk);
                              setDetailsModalOpen(true);
                            }}
                          >
                            <BuildIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View License Plate History">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedTruckForHistory(trk);
                              setHistoryModalOpen(true);
                            }}
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Truck Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingTruck(trk);
                              setTruckModalOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Dialog 1: Create or Edit Truck ── */}
      {truckModalOpen && (
        <TruckFormDialog
          open={truckModalOpen}
          initialData={editingTruck}
          stores={stores}
          availableDrivers={availableDrivers}
          onClose={() => {
            setTruckModalOpen(false);
            setEditingTruck(null);
          }}
          onSave={async (formData) => {
            try {
              if (editingTruck) {
                await updateTruckMutation.mutateAsync({
                  id: editingTruck.id,
                  data: {
                    storeId: formData.storeId || undefined,
                    vehicleType: formData.vehicleType,
                    brandModel: formData.brandModel,
                    chassisNumber: formData.chassisNumber || undefined,
                    engineNumber: formData.engineNumber || undefined,
                    maxPayloadKg: formData.maxPayloadKg ? Number(formData.maxPayloadKg) : undefined,
                    maxVolumeCbm: formData.maxVolumeCbm ? Number(formData.maxVolumeCbm) : undefined,
                    fuelType: formData.fuelType || undefined,
                    taxDueDate: formData.taxDueDate || undefined,
                    stnkExpiryDate: formData.stnkExpiryDate || undefined,
                    kirExpiryDate: formData.kirExpiryDate || undefined,
                    serviceIntervalKm: formData.serviceIntervalKm ? Number(formData.serviceIntervalKm) : undefined,
                    driverEmployeeId: formData.driverEmployeeId || undefined,
                  },
                });
                enqueueSnackbar("Truck details updated successfully", { variant: "success" });
              } else {
                await createTruckMutation.mutateAsync({
                  registrationNumber: formData.registrationNumber,
                  storeId: formData.storeId || undefined,
                  vehicleType: formData.vehicleType,
                  brandModel: formData.brandModel,
                  chassisNumber: formData.chassisNumber || undefined,
                  engineNumber: formData.engineNumber || undefined,
                  maxPayloadKg: formData.maxPayloadKg ? Number(formData.maxPayloadKg) : undefined,
                  maxVolumeCbm: formData.maxVolumeCbm ? Number(formData.maxVolumeCbm) : undefined,
                  fuelType: formData.fuelType || undefined,
                  taxDueDate: formData.taxDueDate || undefined,
                  stnkExpiryDate: formData.stnkExpiryDate || undefined,
                  kirExpiryDate: formData.kirExpiryDate || undefined,
                  serviceIntervalKm: formData.serviceIntervalKm ? Number(formData.serviceIntervalKm) : undefined,
                  driverEmployeeId: formData.driverEmployeeId || undefined,
                });
                enqueueSnackbar("New truck registered successfully", { variant: "success" });
              }
              setTruckModalOpen(false);
              setEditingTruck(null);
            } catch (err: any) {
              enqueueSnackbar(err.response?.data?.message || err.message || "Failed to save truck", {
                variant: "error",
              });
            }
          }}
        />
      )}

      {/* ── Dialog 2: Change License Plate (Ganti Plat Nomor) ── */}
      {plateChangeModalOpen && selectedTruckForPlateChange && (
        <ChangePlateDialog
          open={plateChangeModalOpen}
          truck={selectedTruckForPlateChange}
          onClose={() => {
            setPlateChangeModalOpen(false);
            setSelectedTruckForPlateChange(null);
          }}
          onSave={async (req) => {
            try {
              await changePlateMutation.mutateAsync({
                vehicleId: selectedTruckForPlateChange.id,
                data: req,
              });
              enqueueSnackbar(`License plate updated to ${req.newRegistrationNumber}`, {
                variant: "success",
              });
              setPlateChangeModalOpen(false);
              setSelectedTruckForPlateChange(null);
            } catch (err: any) {
              enqueueSnackbar(err.response?.data?.message || err.message || "Failed to change plate", {
                variant: "error",
              });
            }
          }}
        />
      )}

      {/* ── Dialog 3: Assign / Release Driver (1-to-1) ── */}
      {driverModalOpen && selectedTruckForDriver && (
        <AssignDriverDialog
          open={driverModalOpen}
          truck={selectedTruckForDriver}
          availableDrivers={availableDrivers}
          onClose={() => {
            setDriverModalOpen(false);
            setSelectedTruckForDriver(null);
          }}
          onAssign={async (driverId) => {
            try {
              await assignDriverMutation.mutateAsync({
                vehicleId: selectedTruckForDriver.id,
                driverEmployeeId: driverId,
              });
              enqueueSnackbar("Driver assigned to truck successfully", { variant: "success" });
              setDriverModalOpen(false);
              setSelectedTruckForDriver(null);
            } catch (err: any) {
              enqueueSnackbar(err.response?.data?.message || err.message || "Failed to assign driver", {
                variant: "error",
              });
            }
          }}
          onUnassign={async () => {
            try {
              await unassignDriverMutation.mutateAsync(selectedTruckForDriver.id);
              enqueueSnackbar("Driver unassigned from truck", { variant: "info" });
              setDriverModalOpen(false);
              setSelectedTruckForDriver(null);
            } catch (err: any) {
              enqueueSnackbar(err.response?.data?.message || err.message || "Failed to unassign driver", {
                variant: "error",
              });
            }
          }}
        />
      )}

      {/* ── Dialog 4: License Plate Change History ── */}
      {historyModalOpen && selectedTruckForHistory && (
        <PlateHistoryDialog
          open={historyModalOpen}
          truck={selectedTruckForHistory}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedTruckForHistory(null);
          }}
        />
      )}

      {/* ── Dialog 5: Service Logs, Distance & Health Checks ── */}
      {detailsModalOpen && selectedTruckForDetails && (
        <TruckDetailsDialog
          open={detailsModalOpen}
          truck={selectedTruckForDetails}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedTruckForDetails(null);
          }}
        />
      )}

      {/* ── Dialog 6: Driver License (SIM) Management ── */}
      {licenseModalOpen && selectedDriverForLicense && (
        <DriverLicenseDialog
          open={licenseModalOpen}
          employeeId={selectedDriverForLicense.id}
          driverName={selectedDriverForLicense.name}
          onClose={() => {
            setLicenseModalOpen(false);
            setSelectedDriverForLicense(null);
          }}
        />
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Form Dialog (Create / Edit Truck)
// ─────────────────────────────────────────────────────────────────────────────

interface TruckFormDialogProps {
  open: boolean;
  initialData: VehicleDto | null;
  stores: Array<{ id: string; name: string }>;
  availableDrivers: AvailableDriverDto[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function TruckFormDialog({
  open,
  initialData,
  stores,
  availableDrivers,
  onClose,
  onSave,
}: TruckFormDialogProps) {
  const isEdit = !!initialData;

  const [registrationNumber, setRegistrationNumber] = useState(initialData?.registrationNumber || "");
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialData?.vehicleType || "LIGHT_TRUCK_4W");
  const [brandModel, setBrandModel] = useState(initialData?.brandModel || "");
  const [storeId, setStoreId] = useState(initialData?.storeId || "");
  const [driverEmployeeId, setDriverEmployeeId] = useState(initialData?.driverEmployeeId || "");
  const [taxDueDate, setTaxDueDate] = useState(initialData?.taxDueDate || "");
  const [stnkExpiryDate, setStnkExpiryDate] = useState(initialData?.stnkExpiryDate || "");
  const [kirExpiryDate, setKirExpiryDate] = useState(initialData?.kirExpiryDate || "");
  const [maxPayloadKg, setMaxPayloadKg] = useState(initialData?.maxPayloadKg?.toString() || "3000");
  const [maxVolumeCbm, setMaxVolumeCbm] = useState(initialData?.maxVolumeCbm?.toString() || "12");
  const [fuelType, setFuelType] = useState(initialData?.fuelType || "Solar / Dexlite");
  const [serviceIntervalKm, setServiceIntervalKm] = useState(
    initialData?.serviceIntervalKm?.toString() || "10000"
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim() && !isEdit) return;
    if (!brandModel.trim()) return;

    setSaving(true);
    try {
      await onSave({
        registrationNumber: registrationNumber.trim().toUpperCase(),
        vehicleType,
        brandModel: brandModel.trim(),
        storeId,
        driverEmployeeId: driverEmployeeId || null,
        taxDueDate: taxDueDate || null,
        stnkExpiryDate: stnkExpiryDate || null,
        kirExpiryDate: kirExpiryDate || null,
        maxPayloadKg,
        maxVolumeCbm,
        fuelType,
        serviceIntervalKm,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEdit ? "Edit Truck Master Data" : "Register New Operational Truck"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {/* Row 1: Plate & Brand */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Registration Number (License Plate)"
                required={!isEdit}
                disabled={isEdit}
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                fullWidth
                placeholder="e.g. B 9123 TXD"
                helperText={isEdit ? "Use 'Change License Plate' action to update plate number" : "Indonesian vehicle license plate"}
              />
              <TextField
                label="Brand & Model"
                required
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                fullWidth
                placeholder="e.g. Isuzu Elf NMR 71 HD / Mitsubishi Canter"
              />
            </Box>

            {/* Row 2: Type & Store */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={vehicleType}
                  label="Vehicle Type"
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                >
                  {VEHICLE_TYPES.map((vt) => (
                    <MenuItem key={vt.value} value={vt.value}>
                      {vt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Home Store / Branch</InputLabel>
                <Select
                  value={storeId}
                  label="Home Store / Branch"
                  onChange={(e) => setStoreId(e.target.value)}
                >
                  <MenuItem value="">-- Select Store --</MenuItem>
                  {stores.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* 1-to-1 Driver Assignment */}
            <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon color="primary" fontSize="small" />
                Dedicated Driver Assignment (1-to-1 Linked)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                A truck is assigned exclusively to one driver. A driver cannot be assigned to multiple trucks simultaneously.
              </Typography>

              <FormControl fullWidth size="small">
                <InputLabel>Assigned Driver</InputLabel>
                <Select
                  value={driverEmployeeId}
                  label="Assigned Driver"
                  onChange={(e) => setDriverEmployeeId(e.target.value)}
                >
                  <MenuItem value="">-- No Driver Assigned (Pool / Standby) --</MenuItem>
                  {availableDrivers.map((d) => {
                    const isAssignedToOther = d.isAssigned && d.assignedVehicleId !== initialData?.id;
                    return (
                      <MenuItem
                        key={d.employeeId}
                        value={d.employeeId}
                        disabled={isAssignedToOther}
                      >
                        {d.fullName} ({d.employeeNumber})
                        {isAssignedToOther ? ` — [Already assigned to ${d.assignedRegistrationNumber}]` : " — Available"}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>

            {/* STNK Dates Section */}
            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <EventIcon color="primary" fontSize="small" />
                STNK & Regulatory Inspection Dates
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Monitor the 1-month window before annual tax expiry & 5-year plate expiration.
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                <TextField
                  label="Annual Tax Due Date (Pajak 1 Thn)"
                  type="date"
                  value={taxDueDate}
                  onChange={(e) => setTaxDueDate(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Annual PKB tax due date (1-month warning)"
                />
                <TextField
                  label="5-Year Plate Expiry (STNK Exp)"
                  type="date"
                  value={stnkExpiryDate}
                  onChange={(e) => setStnkExpiryDate(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="5-Year STNK & license plate expiry"
                />
                <TextField
                  label="KIR Expiry Date"
                  type="date"
                  value={kirExpiryDate}
                  onChange={(e) => setKirExpiryDate(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Dishub roadworthiness inspection"
                />
              </Box>
            </Box>

            {/* Specifications */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 2 }}>
              <TextField
                label="Max Payload (kg)"
                type="number"
                value={maxPayloadKg}
                onChange={(e) => setMaxPayloadKg(e.target.value)}
                fullWidth
              />
              <TextField
                label="Max Volume (cbm)"
                type="number"
                value={maxVolumeCbm}
                onChange={(e) => setMaxVolumeCbm(e.target.value)}
                fullWidth
              />
              <TextField
                label="Fuel Type"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                fullWidth
                placeholder="e.g. Solar / Dexlite"
              />
              <TextField
                label="Service Interval (km)"
                type="number"
                value={serviceIntervalKm}
                onChange={(e) => setServiceIntervalKm(e.target.value)}
                fullWidth
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving} sx={{ px: 3 }}>
            {saving ? "Saving..." : isEdit ? "Update Truck" : "Register Truck"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Change License Plate Dialog (Ganti Plat Nomor)
// ─────────────────────────────────────────────────────────────────────────────

interface ChangePlateDialogProps {
  open: boolean;
  truck: VehicleDto;
  onClose: () => void;
  onSave: (req: ChangeLicensePlateRequest) => Promise<void>;
}

function ChangePlateDialog({ open, truck, onClose, onSave }: ChangePlateDialogProps) {
  const [newPlate, setNewPlate] = useState("");
  const [changeDate, setChangeDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("5_YEAR_STNK_RENEWAL");
  const [autoExtendDates, setAutoExtendDates] = useState(true);
  const [newStnkExpiryDate, setNewStnkExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().split("T")[0];
  });
  const [newTaxDueDate, setNewTaxDueDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;

    setSaving(true);
    try {
      await onSave({
        newRegistrationNumber: newPlate.trim().toUpperCase(),
        changeDate,
        reason,
        notes: notes.trim() || undefined,
        newStnkExpiryDate: autoExtendDates ? newStnkExpiryDate : undefined,
        newTaxDueDate: autoExtendDates ? newTaxDueDate : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <SwapHorizIcon color="primary" />
          Change License Plate (Ganti Plat Nomor)
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
              Every license plate modification is permanently audited. Previous plates remain accessible in the audit timeline.
            </Alert>

            {/* Current vs New Plate */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  CURRENT PLATE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "monospace", color: "text.primary" }}>
                  {truck.registrationNumber}
                </Typography>
              </Box>

              <SwapHorizIcon color="action" />

              <Box sx={{ flex: 1 }}>
                <TextField
                  label="NEW LICENSE PLATE"
                  required
                  autoFocus
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  fullWidth
                  placeholder="e.g. B 1234 ABC"
                  slotProps={{
                    htmlInput: { style: { fontFamily: "monospace", fontWeight: 700 } },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Date of Plate Change"
                type="date"
                required
                value={changeDate}
                onChange={(e) => setChangeDate(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <FormControl fullWidth required>
                <InputLabel>Reason for Change</InputLabel>
                <Select
                  value={reason}
                  label="Reason for Change"
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value === "5_YEAR_STNK_RENEWAL") {
                      setAutoExtendDates(true);
                    }
                  }}
                >
                  <MenuItem value="5_YEAR_STNK_RENEWAL">5-Year STNK Renewal (Ganti Kaleng)</MenuItem>
                  <MenuItem value="DAMAGED_OR_LOST_PLATE">Damaged or Lost Plate (Plat Rusak / Hilang)</MenuItem>
                  <MenuItem value="MUTASI_OR_REREGISTRATION">Area Mutation / Transfer (Mutasi Daerah)</MenuItem>
                  <MenuItem value="OTHER">Other Administrative Reason</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Auto extend dates for 5-Year STNK renewal */}
            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoExtendDates}
                    onChange={(e) => setAutoExtendDates(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Update STNK 5-Year Expiry (+5 Yrs) and Tax Due Date (+1 Yr)
                  </Typography>
                }
              />

              {autoExtendDates && (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mt: 1 }}>
                  <TextField
                    label="New STNK Expiry Date (5 Years)"
                    type="date"
                    value={newStnkExpiryDate}
                    onChange={(e) => setNewStnkExpiryDate(e.target.value)}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label="New Annual Tax Due Date (1 Year)"
                    type="date"
                    value={newTaxDueDate}
                    onChange={(e) => setNewTaxDueDate(e.target.value)}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              )}
            </Box>

            <TextField
              label="Administrative Notes / Samsat Notice No."
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              placeholder="e.g. Samsat Jakarta Barat, No. Surat Ketetapan Pajak..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving || !newPlate.trim()} sx={{ px: 3 }}>
            {saving ? "Applying..." : "Confirm Plate Change"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: 1-to-1 Driver Assignment Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface AssignDriverDialogProps {
  open: boolean;
  truck: VehicleDto;
  availableDrivers: AvailableDriverDto[];
  onClose: () => void;
  onAssign: (driverId: string) => Promise<void>;
  onUnassign: () => Promise<void>;
}

function AssignDriverDialog({
  open,
  truck,
  availableDrivers,
  onClose,
  onAssign,
  onUnassign,
}: AssignDriverDialogProps) {
  const [selectedDriverId, setSelectedDriverId] = useState(truck.driverEmployeeId || "");
  const [processing, setProcessing] = useState(false);

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    setProcessing(true);
    try {
      await onAssign(selectedDriverId);
    } finally {
      setProcessing(false);
    }
  };

  const handleUnassign = async () => {
    setProcessing(true);
    try {
      await onUnassign();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
        <PersonIcon color="primary" />
        1-to-1 Driver Assignment — {truck.registrationNumber}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
            Enforcing strict 1-to-1 vehicle ownership. Each delivery truck has one dedicated driver. Drivers assigned to other trucks cannot be chosen.
          </Alert>

          {truck.driverEmployeeId && (
            <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  CURRENTLY ASSIGNED DRIVER
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {truck.driverName} ({truck.driverEmployeeNumber})
                </Typography>
              </Box>
              <Button
                color="error"
                variant="outlined"
                size="small"
                startIcon={<PersonRemoveIcon />}
                disabled={processing}
                onClick={handleUnassign}
              >
                Release Driver
              </Button>
            </Box>
          )}

          <FormControl fullWidth>
            <InputLabel>Select Dedicated Driver</InputLabel>
            <Select
              value={selectedDriverId}
              label="Select Dedicated Driver"
              onChange={(e) => setSelectedDriverId(e.target.value)}
            >
              <MenuItem value="">-- Select Driver --</MenuItem>
              {availableDrivers.map((d) => {
                const isAssignedToOther = d.isAssigned && d.assignedVehicleId !== truck.id;
                return (
                  <MenuItem key={d.employeeId} value={d.employeeId} disabled={isAssignedToOther}>
                    {d.fullName} ({d.employeeNumber})
                    {isAssignedToOther ? ` — [Assigned to ${d.assignedRegistrationNumber}]` : " — Available"}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={processing} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={processing || !selectedDriverId || selectedDriverId === truck.driverEmployeeId}
          onClick={handleAssign}
          sx={{ px: 3 }}
        >
          {processing ? "Saving..." : "Confirm Assignment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: License Plate History Dialog
// ─────────────────────────────────────────────────────────────────────────────

function PlateHistoryDialog({
  open,
  truck,
  onClose,
}: {
  open: boolean;
  truck: VehicleDto;
  onClose: () => void;
}) {
  const language = useLanguage();
  const { data: history = [], isLoading } = usePlateHistory(truck.id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
        <HistoryIcon color="primary" />
        Plate Change History — {truck.registrationNumber} ({truck.brandModel})
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Loading plate change audit trail...
            </Typography>
          </Box>
        ) : history.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: "text.secondary" }}>
              No previous plate changes recorded
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current license plate ({truck.registrationNumber}) is the initial vehicle registration.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: "background.default" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Previous Plate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>New Plate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Changed By</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell>{formatDate(h.changeDate, language)}</TableCell>
                    <TableCell>
                      <Chip label={h.oldRegistrationNumber} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={h.newRegistrationNumber} size="small" color="primary" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                        {h.reason.replace(/_/g, " ").toLowerCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>{h.changedByEmployeeName || "-"}</TableCell>
                    <TableCell>{h.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
