import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import { commissionTierApi } from "./api";
import type { CommissionTier, CommissionTierRequest } from "./types";

const formatRupiah = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "No Limit (Top Tier)";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (rate: number): string => {
  return `${(rate * 100).toFixed(2)}%`;
};

export const CommissionTiersPage: React.FC = () => {
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
  const [formData, setFormData] = useState<CommissionTierRequest>({
    tierName: "",
    minSalesVolume: 0,
    maxSalesVolume: null,
    commissionRate: 0.01,
    colorCode: "#CD7F32",
    displayOrder: 1,
    isActive: true,
  });

  const loadTiers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await commissionTierApi.listTiers();
      setTiers(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load commission tiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTiers();
  }, []);

  const handleOpenCreate = () => {
    setEditingTier(null);
    setFormData({
      tierName: "",
      minSalesVolume: tiers.length > 0 ? (tiers[tiers.length - 1].maxSalesVolume || 0) : 0,
      maxSalesVolume: null,
      commissionRate: 0.015,
      colorCode: "#CD7F32",
      displayOrder: tiers.length + 1,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (tier: CommissionTier) => {
    setEditingTier(tier);
    setFormData({
      tierName: tier.tierName,
      minSalesVolume: tier.minSalesVolume,
      maxSalesVolume: tier.maxSalesVolume,
      commissionRate: tier.commissionRate,
      colorCode: tier.colorCode || "#CD7F32",
      displayOrder: tier.displayOrder,
      isActive: tier.isActive,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTier(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      if (editingTier) {
        await commissionTierApi.updateTier(editingTier.id, formData);
        setSuccess(`Commission tier "${formData.tierName}" updated successfully`);
      } else {
        await commissionTierApi.createTier(formData);
        setSuccess(`Commission tier "${formData.tierName}" created successfully`);
      }
      handleCloseDialog();
      await loadTiers();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save commission tier");
    }
  };

  const handleDelete = async (tier: CommissionTier) => {
    if (!window.confirm(`Are you sure you want to delete tier "${tier.tierName}"?`)) return;
    try {
      setError(null);
      await commissionTierApi.deleteTier(tier.id);
      setSuccess(`Commission tier "${tier.tierName}" deleted`);
      await loadTiers();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete commission tier");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
            <MilitaryTechIcon color="primary" fontSize="large" />
            Showroom Floor Sales Commission Tiers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dynamic showroom commission volume brackets & rates managed by Store Owner and Branch Managers.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Add Commission Tier
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Visual Tier Cards Summary */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        {tiers.map((tier) => (
          <Box key={tier.id} sx={{ flex: "1 1 calc(25% - 16px)", minWidth: 220 }}>
            <Card
              sx={{
                borderLeft: `6px solid ${tier.colorCode || "#1976d2"}`,
                boxShadow: 2,
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {tier.tierName}
                  </Typography>
                  <Chip
                    label={tier.isActive ? "Active" : "Inactive"}
                    size="small"
                    color={tier.isActive ? "success" : "default"}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Rate: <strong>{formatPercent(tier.commissionRate)}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Min: {formatRupiah(tier.minSalesVolume)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Max: {formatRupiah(tier.maxSalesVolume)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Table of Tiers */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ backgroundColor: "action.hover" }}>
              <TableRow>
                <TableCell><strong>Order</strong></TableCell>
                <TableCell><strong>Tier Name</strong></TableCell>
                <TableCell><strong>Min Sales Volume</strong></TableCell>
                <TableCell><strong>Max Sales Volume</strong></TableCell>
                <TableCell><strong>Commission Rate</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No commission tiers configured. Click &quot;Add Commission Tier&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                tiers.map((tier) => (
                  <TableRow key={tier.id} hover>
                    <TableCell>{tier.displayOrder}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            backgroundColor: tier.colorCode || "#CD7F32",
                          }}
                        />
                        <Typography sx={{ fontWeight: 500 }}>{tier.tierName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{formatRupiah(tier.minSalesVolume)}</TableCell>
                    <TableCell>{formatRupiah(tier.maxSalesVolume)}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatPercent(tier.commissionRate)}
                        size="small"
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: `${tier.colorCode}22` || undefined,
                          color: tier.colorCode || undefined,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tier.isActive ? "Active" : "Inactive"}
                        size="small"
                        color={tier.isActive ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEdit(tier)} color="primary" aria-label="Edit Tier">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(tier)} color="error" aria-label="Delete Tier">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingTier ? `Edit Tier: ${editingTier.tierName}` : "Create Commission Tier"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              label="Tier Name"
              required
              fullWidth
              value={formData.tierName}
              onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
              placeholder="e.g. Bronze, Silver, Gold, Platinum"
            />
            <TextField
              label="Minimum Sales Volume (IDR)"
              type="number"
              required
              fullWidth
              value={formData.minSalesVolume}
              onChange={(e) => setFormData({ ...formData, minSalesVolume: parseFloat(e.target.value) || 0 })}
            />
            <TextField
              label="Maximum Sales Volume (IDR) — Leave blank for top tier"
              type="number"
              fullWidth
              value={formData.maxSalesVolume ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxSalesVolume: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
            />
            <TextField
              label="Commission Rate (Decimal, e.g. 0.015 for 1.5%)"
              type="number"
              required
              fullWidth
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
              helperText={`Yields ${(formData.commissionRate * 100).toFixed(2)}% on sales volume`}
            />
            <TextField
              label="Badge / Theme Color Code (Hex)"
              fullWidth
              value={formData.colorCode}
              onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
              placeholder="#CD7F32"
            />
            <TextField
              label="Display Order"
              type="number"
              fullWidth
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active Status"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save Tier
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CommissionTiersPage;
