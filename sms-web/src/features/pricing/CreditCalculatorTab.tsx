import { useState, useMemo } from "react";
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
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveIcon from "@mui/icons-material/Remove";
import TvIcon from "@mui/icons-material/Tv";
import WeekendIcon from "@mui/icons-material/Weekend";
import KitchenIcon from "@mui/icons-material/Kitchen";
import BedIcon from "@mui/icons-material/Bed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  calculatePriceMatrix,
  calculateInstallment,
  getSuggestedDp,
  calculateBundleSimulation,
  generateBundleShareSummary,
  type BundleItem,
} from "../../lib/priceCalculator";
import { formatCurrency, formatNumber, t } from "../../lib/locale";

interface Props {
  storeName?: string;
}

export default function CreditCalculatorTab({ storeName }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<"single" | "bundle">("single");

  // Single Simulation State
  const [hdInput, setHdInput] = useState<string>("4500000");
  const [singleDpMode, setSingleDpMode] = useState<"auto" | "percent" | "nominal">("auto");
  const [singlePercent, setSinglePercent] = useState<number>(10);
  const [singleNominalDp, setSingleNominalDp] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const parsedSingleHd = Number(hdInput.replace(/[^0-9]/g, "")) || 0;
  const singleSuggestedDp = useMemo(() => getSuggestedDp(parsedSingleHd), [parsedSingleHd]);

  const effectiveSingleDp = useMemo(() => {
    if (singleDpMode === "auto") return singleSuggestedDp;
    if (singleDpMode === "percent") {
      return Math.round((parsedSingleHd * singlePercent) / 100);
    }
    return Number(singleNominalDp.replace(/[^0-9]/g, "")) || 0;
  }, [singleDpMode, parsedSingleHd, singleSuggestedDp, singlePercent, singleNominalDp]);

  const singleTerms = [6, 10, 12, 15, 18, 24];
  const singleSimulation = useMemo(() => {
    return calculatePriceMatrix(parsedSingleHd, effectiveSingleDp, singleTerms);
  }, [parsedSingleHd, effectiveSingleDp]);

  // Multi-Product Bundle Simulator State
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([
    {
      id: "b1",
      name: "Smart TV 55 Inch UHD 4K",
      category: "Elektronik",
      quantity: 1,
      hargaDasar: 5000000,
      cashPrice: 5500000,
    },
    {
      id: "b2",
      name: "Sofa Bed L-Shape Scandinavian",
      category: "Furnitur",
      quantity: 1,
      hargaDasar: 3500000,
      cashPrice: 4000000,
    },
  ]);
  const [bundleDiscountPercent, setBundleDiscountPercent] = useState<number>(0);
  const [bundleDpMode, setBundleDpMode] = useState<"auto" | "percent" | "nominal">("auto");
  const [bundleDpPercent, setBundleDpPercent] = useState<number>(10);
  const [bundleNominalDp, setBundleNominalDp] = useState<string>("");
  const [selectedBundleTenor, setSelectedBundleTenor] = useState<number>(10);

  // Add Item Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<string>("Elektronik");
  const [newItemPrice, setNewItemPrice] = useState<string>("");
  const [newItemQty, setNewItemQty] = useState<number>(1);

  const bundleTotalHd = useMemo(() => {
    return bundleItems.reduce((sum, it) => sum + (it.hargaDasar || 0) * (it.quantity || 1), 0);
  }, [bundleItems]);

  const effectiveBundleDp = useMemo(() => {
    const discount = Math.round((bundleTotalHd * bundleDiscountPercent) / 100);
    const netHd = Math.max(0, bundleTotalHd - discount);
    if (bundleDpMode === "auto") return undefined; // trigger auto bracket
    if (bundleDpMode === "percent") {
      return Math.round((netHd * bundleDpPercent) / 100);
    }
    return Number(bundleNominalDp.replace(/[^0-9]/g, "")) || 0;
  }, [bundleTotalHd, bundleDiscountPercent, bundleDpMode, bundleDpPercent, bundleNominalDp]);

  const bundleSimulation = useMemo(() => {
    return calculateBundleSimulation(bundleItems, {
      discountPercent: bundleDiscountPercent,
      downPayment: effectiveBundleDp,
      terms: [6, 10, 12, 15, 18, 24],
    });
  }, [bundleItems, bundleDiscountPercent, effectiveBundleDp]);

  const selectedBundlePlan = useMemo(() => {
    return (
      bundleSimulation.terms.find((t) => t.termMonths === selectedBundleTenor) ||
      bundleSimulation.terms[0]
    );
  }, [bundleSimulation, selectedBundleTenor]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} berhasil disalin ke clipboard!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleCopySingleQuote = () => {
    const lines = [
      `*SIMULASI KREDIT CUSTOM DP*`,
      `Harga Dasar: *${formatCurrency(parsedSingleHd)}*`,
      `Uang Muka (DP): *${formatCurrency(effectiveSingleDp)}* (${parsedSingleHd > 0 ? Math.round((effectiveSingleDp / parsedSingleHd) * 100) : 0}%)`,
      `--------------------------------`,
      `*PILIHAN ANGSURAN:*`,
    ];
    singleSimulation.terms.forEach((t) => {
      lines.push(`- *${t.termMonths} Bulan*: ${formatCurrency(t.monthlyInstallment)} / bln (Total: ${formatCurrency(t.totalPrice + effectiveSingleDp)})`);
    });
    lines.push(`--------------------------------`);
    lines.push(`*Termasuk diskon 15% insentif pembayaran tepat waktu.*`);
    copyToClipboard(lines.join("\n"), "Simulasi kredit tunggal");
  };

  const handleCopyBundleQuote = () => {
    const text = generateBundleShareSummary(bundleSimulation, {
      storeName: storeName || "Showroom SMS",
      note: "1 Kontrak Financed Gabungan, hemat admin & cicilan bulanan.",
    });
    copyToClipboard(text, "Simulasi paket bundle");
  };

  const handleAddProductToBundle = () => {
    const price = Number(newItemPrice.replace(/[^0-9]/g, "")) || 0;
    if (newItemName.trim() && price > 0) {
      setBundleItems((prev) => [
        ...prev,
        {
          id: `item_${Date.now()}`,
          name: newItemName.trim(),
          category: newItemCategory,
          quantity: newItemQty > 0 ? newItemQty : 1,
          hargaDasar: price,
          cashPrice: price,
        },
      ]);
      setNewItemName("");
      setNewItemPrice("");
      setNewItemQty(1);
      setIsAddDialogOpen(false);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      {/* Sub Tabs */}
      <Tabs
        value={activeSubTab}
        onChange={(_e, v) => setActiveSubTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          value="single"
          label={t("Simulasi Satuan (Custom DP)")}
          icon={<CalculateIcon />}
          iconPosition="start"
          sx={{ fontWeight: 700 }}
        />
        <Tab
          value="bundle"
          label={t("Paket Bundle Showroom")}
          icon={<AutoAwesomeIcon />}
          iconPosition="start"
          sx={{ fontWeight: 700 }}
        />
      </Tabs>

      {copyFeedback && (
        <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setCopyFeedback(null)}>
          {copyFeedback}
        </Alert>
      )}

      {/* SUBTAB 1: SINGLE CALC / DEPOSIT SIMULATOR */}
      {activeSubTab === "single" && (
        <Box>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "primary.main" }}>
                Kalkulator Kredit & Simulasi DP Terbuka
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Simulasikan cicilan pembiayaan retail dengan negosiasi uang muka (DP) fleksibel sesuai formula resmi perusahaan.
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Harga Dasar Produk (HD)"
                    value={hdInput}
                    onChange={(e) => setHdInput(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                    }}
                    helperText={`Format Rupiah: ${formatCurrency(parsedSingleHd)}`}
                  />

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Metode Penentuan Uang Muka (DP):
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                      <Chip
                        label="Auto Rekomendasi Bracket"
                        color={singleDpMode === "auto" ? "primary" : "default"}
                        variant={singleDpMode === "auto" ? "filled" : "outlined"}
                        onClick={() => setSingleDpMode("auto")}
                        clickable
                      />
                      <Chip
                        label="Persentase (%)"
                        color={singleDpMode === "percent" ? "primary" : "default"}
                        variant={singleDpMode === "percent" ? "filled" : "outlined"}
                        onClick={() => setSingleDpMode("percent")}
                        clickable
                      />
                      <Chip
                        label="Nominal Custom"
                        color={singleDpMode === "nominal" ? "primary" : "default"}
                        variant={singleDpMode === "nominal" ? "filled" : "outlined"}
                        onClick={() => setSingleDpMode("nominal")}
                        clickable
                      />
                    </Box>

                    {singleDpMode === "percent" && (
                      <Box sx={{ px: 1, mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Persentase DP: {singlePercent}% ({formatCurrency(effectiveSingleDp)})
                        </Typography>
                        <Slider
                          value={singlePercent}
                          onChange={(_e, v) => setSinglePercent(v as number)}
                          min={0}
                          max={40}
                          step={5}
                          marks
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    )}

                    {singleDpMode === "nominal" && (
                      <TextField
                        fullWidth
                        size="small"
                        sx={{ mt: 1 }}
                        label="Nominal DP Custom (Rp)"
                        value={singleNominalDp}
                        onChange={(e) => setSingleNominalDp(e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* DP & Financed Summary Card */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "grey.50" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                    Ringkasan Struktur Pembiayaan:
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Harga Dasar (HD):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(parsedSingleHd)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Uang Muka (DP):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {formatCurrency(effectiveSingleDp)} ({parsedSingleHd > 0 ? Math.round((effectiveSingleDp / parsedSingleHd) * 100) : 0}%)
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Sisa Pokok Dibiayai:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatCurrency(Math.max(0, parsedSingleHd - effectiveSingleDp))}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopySingleQuote}
                  >
                    Salin Quotation Simulasi (WhatsApp)
                  </Button>
                </Paper>
              </Box>

              {/* Installment Schedule Table */}
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 4, mb: 1.5 }}>
                Tabel Simulasi Angsuran Berbagai Tenor:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Tenor (Bulan)</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Angsuran per Bulan</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Total Harga Cicilan</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Total Biaya Konsumen (+DP)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {singleSimulation.terms.map((t) => (
                      <TableRow key={t.termMonths} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{t.termMonths} Bulan</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>
                          {formatCurrency(t.monthlyInstallment)}
                        </TableCell>
                        <TableCell>{formatCurrency(t.totalPrice)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {formatCurrency(t.totalPrice + effectiveSingleDp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* SUBTAB 2: MULTI-PRODUCT BUNDLE SIMULATOR */}
      {activeSubTab === "bundle" && (
        <Box>
          {/* Header Banner */}
          <Paper
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2,
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <AutoAwesomeIcon sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {t("Multi-Product Credit Bundle Simulator")}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Alat showroom bundling interaktif yang memungkinkan salesperson menggabungkan Elektronik (TV) & Furnitur (Sofa)
                  ke dalam satu kontrak kredit terpadu dengan DP gabungan & jadwal cicilan bersama (1x biaya penanganan).
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Quick Preset Buttons */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                {t("Preset Paket Populer Showroom:")}
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<WeekendIcon />}
                  onClick={() =>
                    setBundleItems([
                      { id: "p1", name: "Smart TV 55 Inch UHD 4K", category: "Elektronik", quantity: 1, hargaDasar: 5000000, cashPrice: 5500000 },
                      { id: "p2", name: "Sofa Bed L-Shape Scandinavian", category: "Furnitur", quantity: 1, hargaDasar: 3500000, cashPrice: 4000000 },
                    ])
                  }
                >
                  Ruang Tamu: TV + Sofa
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<BedIcon />}
                  onClick={() =>
                    setBundleItems([
                      { id: "p3", name: "Springbed Queen 160x200", category: "Furnitur", quantity: 1, hargaDasar: 4200000, cashPrice: 4800000 },
                      { id: "p4", name: "Lemari Pakaian 3 Pintu Cermin", category: "Furnitur", quantity: 1, hargaDasar: 3200000, cashPrice: 3700000 },
                    ])
                  }
                >
                  Kamar Tidur: Springbed + Lemari
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<KitchenIcon />}
                  onClick={() =>
                    setBundleItems([
                      { id: "p5", name: "Kulkas 2 Pintu Inverter", category: "Elektronik", quantity: 1, hargaDasar: 4000000, cashPrice: 4500000 },
                      { id: "p6", name: "Mesin Cuci Front Load 8kg", category: "Elektronik", quantity: 1, hargaDasar: 3800000, cashPrice: 4200000 },
                    ])
                  }
                >
                  Dapur & Elektronik: Kulkas + Mesin Cuci
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Bundle Items Table & Manager */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {t("Item dalam Paket")} ({bundleItems.length})
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  {t("Tambah Produk")}
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Nama Produk</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Kategori</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Harga Dasar</TableCell>
                      <TableCell sx={{ fontWeight: 800, textAlign: "center" }}>Jumlah</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Subtotal</TableCell>
                      <TableCell sx={{ fontWeight: 800, textAlign: "center" }}>Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bundleItems.map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={item.category}
                            color={item.category === "Elektronik" ? "info" : "warning"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(item.hargaDasar)}</TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              disabled={item.quantity <= 1}
                              onClick={() => {
                                setBundleItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, quantity: it.quantity - 1 } : it))
                                );
                              }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setBundleItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, quantity: it.quantity + 1 } : it))
                                );
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {formatCurrency(item.hargaDasar * item.quantity)}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setBundleItems((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Total & Discount Controls */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {t("Diskon Promo Paket")}:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                    {[0, 5, 10, 15].map((pct) => (
                      <Chip
                        key={pct}
                        label={pct === 0 ? "Tanpa Diskon" : `Diskon ${pct}%`}
                        color={bundleDiscountPercent === pct ? "success" : "default"}
                        variant={bundleDiscountPercent === pct ? "filled" : "outlined"}
                        onClick={() => setBundleDiscountPercent(pct)}
                        clickable
                      />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {t("Uang Muka (DP) Gabungan")}:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                    <Chip
                      label="Auto Bracket"
                      color={bundleDpMode === "auto" ? "primary" : "default"}
                      variant={bundleDpMode === "auto" ? "filled" : "outlined"}
                      onClick={() => setBundleDpMode("auto")}
                      clickable
                    />
                    <Chip
                      label="Persentase (%)"
                      color={bundleDpMode === "percent" ? "primary" : "default"}
                      variant={bundleDpMode === "percent" ? "filled" : "outlined"}
                      onClick={() => setBundleDpMode("percent")}
                      clickable
                    />
                    <Chip
                      label="Nominal Custom"
                      color={bundleDpMode === "nominal" ? "primary" : "default"}
                      variant={bundleDpMode === "nominal" ? "filled" : "outlined"}
                      onClick={() => setBundleDpMode("nominal")}
                      clickable
                    />
                  </Box>

                  {bundleDpMode === "percent" && (
                    <Box sx={{ px: 1, mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Persentase DP: {bundleDpPercent}%
                      </Typography>
                      <Slider
                        value={bundleDpPercent}
                        onChange={(_e, v) => setBundleDpPercent(v as number)}
                        min={0}
                        max={30}
                        step={5}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  )}

                  {bundleDpMode === "nominal" && (
                    <TextField
                      fullWidth
                      size="small"
                      sx={{ mt: 1 }}
                      label="Nominal DP Gabungan (Rp)"
                      value={bundleNominalDp}
                      onChange={(e) => setBundleNominalDp(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                      }}
                    />
                  )}
                </Box>

                {/* Bundle Financial Summary Card */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "grey.50" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                    Rincian Finansial Paket:
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Total Harga Dasar Item:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatCurrency(bundleSimulation.totalHargaDasar)}
                    </Typography>
                  </Box>
                  {bundleSimulation.bundleDiscount > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2" color="success.main">
                        Diskon Promo Bundle ({bundleDiscountPercent}%):
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                        - {formatCurrency(bundleSimulation.bundleDiscount)}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Harga Bersih Paket:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
                      {formatCurrency(bundleSimulation.netHargaDasar)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Total DP Gabungan:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatCurrency(bundleSimulation.downPayment)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyBundleQuote}
                  >
                    {t("Salin Rincian Paket untuk WhatsApp")}
                  </Button>
                </Paper>
              </Box>
            </CardContent>
          </Card>

          {/* Shared Installment Schedule Card */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                {t("Pilihan Tenor Cicilan Gabungan (Satu Kontrak)")}
              </Typography>

              {/* Tenor Chips */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
                {[6, 10, 12, 15, 18, 24].map((tenor) => (
                  <Chip
                    key={tenor}
                    label={`${tenor} Bulan`}
                    color={selectedBundleTenor === tenor ? "primary" : "default"}
                    variant={selectedBundleTenor === tenor ? "filled" : "outlined"}
                    onClick={() => setSelectedBundleTenor(tenor)}
                    clickable
                    sx={{ fontWeight: 700, px: 1 }}
                  />
                ))}
              </Box>

              {/* Hero Selected Installment & Comparison Badge */}
              {selectedBundlePlan && (
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "primary.light",
                    bgcolor: "primary.50",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1 }}>
                        ANGSURAN BULANAN SATU KONTRAK ({selectedBundleTenor} BULAN)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: "primary.main", my: 0.5 }}>
                        {formatCurrency(selectedBundlePlan.monthlyInstallment)}
                        <Typography component="span" variant="body1" sx={{ color: "text.secondary", ml: 1 }}>
                          / bulan
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Kontrak: {formatCurrency(selectedBundlePlan.totalPrice)} (+ DP: {formatCurrency(bundleSimulation.downPayment)})
                      </Typography>
                    </Box>

                    {bundleSimulation.monthlySavings[selectedBundleTenor] > 0 && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={`Hemat ${formatCurrency(bundleSimulation.monthlySavings[selectedBundleTenor])}/bln vs Kredit Terpisah!`}
                        color="success"
                        sx={{ fontWeight: 800, py: 2, px: 1, fontSize: 13 }}
                      />
                    )}
                  </Box>
                </Paper>
              )}

              {/* Comprehensive Comparison Table Across All Tenors */}
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                {t("Tabel Komparasi Cicilan Semua Tenor")}:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Tenor</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Angsuran Paket (1 Kontrak)</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Jika Dicicil Terpisah</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Selisih Hemat per Bulan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bundleSimulation.terms.map((t) => {
                      const sep = bundleSimulation.separateTotalInstallments[t.termMonths] || 0;
                      const sav = bundleSimulation.monthlySavings[t.termMonths] || 0;
                      const isCurrent = t.termMonths === selectedBundleTenor;
                      return (
                        <TableRow
                          key={t.termMonths}
                          hover
                          sx={{ bgcolor: isCurrent ? "primary.50" : "inherit" }}
                        >
                          <TableCell sx={{ fontWeight: isCurrent ? 800 : 600 }}>
                            {t.termMonths} Bulan
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>
                            {formatCurrency(t.monthlyInstallment)}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>
                            {formatCurrency(sep)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: sav > 0 ? "success.main" : "text.secondary" }}>
                            {sav > 0 ? `Hemat ${formatCurrency(sav)} / bln` : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Add Product Dialog */}
          <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>{t("Tambah Produk")} ke Paket</DialogTitle>
            <DialogContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <TextField
                  fullWidth
                  label="Nama Produk"
                  placeholder="Misal: Kulkas Sharp 2 Pintu"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <FormControl fullWidth>
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    value={newItemCategory}
                    label="Kategori"
                    onChange={(e) => setNewItemCategory(e.target.value)}
                  >
                    <MenuItem value="Elektronik">Elektronik</MenuItem>
                    <MenuItem value="Furnitur">Furnitur</MenuItem>
                    <MenuItem value="Gadget">Gadget & IT</MenuItem>
                    <MenuItem value="Rumah Tangga">Rumah Tangga</MenuItem>
                    <MenuItem value="Lainnya">Lainnya</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Harga Dasar (HD)"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                  }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Jumlah (Qty)"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: 1 }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
              <Button variant="contained" onClick={handleAddProductToBundle}>
                {t("Tambah Produk")}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
}
