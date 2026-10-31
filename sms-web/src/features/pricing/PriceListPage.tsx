import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import AutoModeIcon from "@mui/icons-material/AutoMode";
import HistoryIcon from "@mui/icons-material/History";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useStores } from "../stores/hooks";
import {
  usePriceList,
  useAutoApplyAllPricing,
  usePriceListVersions,
  useLatestPriceListVersion,
  useGenerateAndStorePriceListVersion,
  useDeletePriceListVersion,
} from "./hooks";
import { exportToExcel } from "../../lib/exportExcel";
import type { PriceListItem, PriceListVersion } from "./types";
import { formatCurrency, formatDate, formatNumber, t } from "../../lib/locale";

function formatLocalizedDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return formatDate(date, undefined, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${formatNumber(bytes / 1024, undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} KB`;
  }
  return `${formatNumber(bytes / (1024 * 1024), undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MB`;
}

export default function PriceListPage() {
  const { data: stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"catalog" | "versioning">("catalog");
  const [groupBy, setGroupBy] = useState<string>("category");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Default validFrom to today (YYYY-MM-DD)
  const todayIso = new Date().toISOString().substring(0, 10);
  const [validFromDate, setValidFromDate] = useState<string>(todayIso);

  // Modal for generating version
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [versionNotes, setVersionNotes] = useState("");
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Default to first store if available
  const activeStoreId = selectedStoreId || (stores && stores.length > 0 ? stores[0].id : "");

  // Active catalog report query
  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = usePriceList(activeStoreId || null, groupBy, validFromDate);

  // Document versioning queries and mutations
  const { data: versions, isLoading: isVersionsLoading } = usePriceListVersions(activeStoreId || null);
  const { data: latestStoredVersion } = useLatestPriceListVersion(activeStoreId || null, groupBy);
  const generateAndStoreMutation = useGenerateAndStorePriceListVersion(activeStoreId);
  const deleteVersionMutation = useDeletePriceListVersion(activeStoreId);
  const autoApplyAll = useAutoApplyAllPricing(activeStoreId);

  const formatThousands = (val: number | null | undefined): string => {
    if (!val || val <= 0) return "-";
    const ribuan = val >= 10000 ? Math.round(val / 1000) : val;
    return formatNumber(ribuan);
  };

  const formatRupiah = (val: number | null | undefined): string => {
    if (!val || val <= 0) return "-";
    return formatCurrency(val);
  };

  // Filter groups and items by search query
  const filteredGroups = useMemo(() => {
    if (!report?.groups) return [];
    if (!searchQuery.trim()) return report.groups;

    const q = searchQuery.toLowerCase();
    return report.groups
      .map((group) => {
        const matchingItems = group.items.filter(
          (item) =>
            item.displayName.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            (item.brandName && item.brandName.toLowerCase().includes(q)) ||
            (item.categoryName && item.categoryName.toLowerCase().includes(q)) ||
            (item.specifications && item.specifications.toLowerCase().includes(q))
        );
        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [report, searchQuery]);

  // Handle Print / PDF View
  const handlePrint = () => {
    if (!activeStoreId) return;
    const printUrl = `/api/documents/print/price-list?storeId=${encodeURIComponent(
      activeStoreId
    )}&groupBy=${encodeURIComponent(groupBy)}&validFrom=${encodeURIComponent(validFromDate)}`;
    window.open(printUrl, "_blank");
  };

  // Handle Download Stored Version directly without regeneration
  const handleDownloadStoredVersion = () => {
    if (!latestStoredVersion) {
      alert(t("No saved document versions on the server for this branch. Click 'Generate & Save to Server' first."));
      return;
    }
    const link = document.createElement("a");
    link.href = latestStoredVersion.downloadUrl;
    link.setAttribute("download", latestStoredVersion.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Generate and Store to Server with Auto-Download for optimal UX
  const handleConfirmGenerateAndStore = () => {
    if (!activeStoreId) return;
    generateAndStoreMutation.mutate(
      {
        groupBy,
        validFrom: validFromDate,
        notes: versionNotes.trim() || undefined,
      },
      {
        onSuccess: (newVersion: PriceListVersion) => {
          setIsGenerateModalOpen(false);
          setVersionNotes("");
          setSuccessBanner(t(
            "Version {versionCode} was saved to the server and downloaded automatically.",
            undefined,
            { versionCode: newVersion.versionCode },
          ));

          // Auto-download for smooth UX so user doesn't need to click download again
          const link = document.createElement("a");
          link.href = newVersion.downloadUrl;
          link.setAttribute("download", newVersion.fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        },
        onError: () => {
          alert(t("Failed to generate and save document version to server."));
        },
      }
    );
  };

  // Handle Delete Version
  const handleDeleteVersion = (version: PriceListVersion) => {
    if (
      window.confirm(
        t("Are you sure you want to delete archived document version \"{code}\" ({title})?", undefined, { code: version.versionCode, title: version.title }) + "\n\n" + t("Other versions will not be deleted.")
      )
    ) {
      deleteVersionMutation.mutate(version.id, {
        onSuccess: () => {
          setSuccessBanner(t("Version {versionCode} was deleted.", undefined, {
            versionCode: version.versionCode,
          }));
        },
        onError: () => {
          alert(t("Failed to delete document version."));
        },
      });
    }
  };

  // Handle Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (!report || !report.groups) return;

    const flatRows: Array<
      PriceListItem & { groupTitle: string; no: number }
    > = [];

    report.groups.forEach((group) => {
      group.items.forEach((item, idx) => {
        flatRows.push({
          ...item,
          groupTitle: group.groupName,
          no: idx + 1,
        });
      });
    });

    if (flatRows.length === 0) {
      alert(t("No price data available to export."));
      return;
    }

    const dateClean = validFromDate.replace(/-/g, "");
    exportToExcel({
      filename: `Daftar_Harga_${report.storeName.replace(/\s+/g, "_")}_${dateClean}`,
      sheetName: t("Price List"),
      title: t("Retail price list — electronics & furniture"),
      subtitle: `${report.storeName} • ${t("Effective from")} ${formatLocalizedDate(validFromDate)}`,
      metadata: {
        "Cabang Toko": report.storeName,
        [t("Effective from")]: formatLocalizedDate(validFromDate),
        "Total Produk": flatRows.length,
        "Satuan Kolom": "Ribuan Rupiah (x Rp 1.000)",
      },
      columns: [
        { key: "groupTitle", label: t("Kelompok / Kategori"), width: 22 },
        { key: "no", label: t("No"), width: 6 },
        { key: "displayName", label: t("Jenis & Merk / Nama Barang"), width: 34 },
        { key: "sku", label: t("Kode / Model"), width: 16 },
        { key: "specifications", label: t("Keterangan / Specs"), width: 20 },
        {
          key: "hargaDasar",
          label: t("HD (Harga Dasar)"),
          width: 14,
          format: (v) => formatThousands(Number(v)),
        },
        {
          key: "downPayment",
          label: t("DP (Uang Muka)"),
          width: 14,
          format: (v) => formatThousands(Number(v)),
        },
        {
          key: "installment10",
          label: t("Angsuran 10 Bln"),
          width: 16,
          format: (v) => formatThousands(Number(v)),
        },
        {
          key: "installment12",
          label: t("Angsuran 12 Bln"),
          width: 16,
          format: (v) => formatThousands(Number(v)),
        },
        {
          key: "installment15",
          label: t("Angsuran 15 Bln"),
          width: 16,
          format: (v) => formatThousands(Number(v)),
        },
        {
          key: "cashPrice",
          label: t("Harga Tunai Penuh (Rp)"),
          width: 18,
          format: (v) => (v ? Number(v) : ""),
        },
      ],
      data: flatRows,
    });
  };

  const handleAutoApplyAll = () => {
    if (!activeStoreId) return;
    if (
      window.confirm(
        t("Recalculate and apply the standard installment formula (10x, 12x, 15x) to all products at this branch?")
      )
    ) {
      autoApplyAll.mutate(undefined, {
        onSuccess: (count) => {
          alert(t("Installment matrix updated successfully for {count} products.", undefined, { count: count }));
          refetch();
        },
        onError: () => {
          alert(t("Failed to automatically calculate product prices."));
        },
      });
    }
  };

  return (
    <Box>
      {/* Page Title & Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PriceCheckIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t("Daftar Harga & Skema Angsuran (Price List)")}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("Daftar harga retail resmi elektronik & furnitur dengan rumus hitung cicilan 10x, 12x, dan 15x, serta manajemen versi dokumen tersimpan di server.")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={() => setIsGenerateModalOpen(true)}
            disabled={!activeStoreId || isLoading || generateAndStoreMutation.isPending}
          >
            {generateAndStoreMutation.isPending
              ? t("Menyimpan...")
              : t("Generate & Simpan ke Server")}
          </Button>

          <Tooltip
            title={
              latestStoredVersion
                ? t("Download stored version directly: {versionCode} ({validFrom})", undefined, {
                    versionCode: latestStoredVersion.versionCode,
                    validFrom: formatLocalizedDate(latestStoredVersion.validFrom),
                  })
                : t("Belum ada versi tersimpan di server")
            }
          >
            <span>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadStoredVersion}
                disabled={!activeStoreId || !latestStoredVersion}
              >
                {t("Unduh Versi Tersimpan")}
              </Button>
            </span>
          </Tooltip>

          <Button
            variant="outlined"
            color="info"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!activeStoreId || isLoading}
          >
            {t("Cetak PDF / Print")}
          </Button>

          <Button
            variant="outlined"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={!activeStoreId || isLoading}
          >
            {t("Ekspor Excel (.xlsx)")}
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<AutoModeIcon />}
            onClick={handleAutoApplyAll}
            disabled={!activeStoreId || autoApplyAll.isPending}
          >
            {autoApplyAll.isPending
              ? t("Menghitung...")
              : t("Auto-Hitung Semua")}
          </Button>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_e, val) => {
          setActiveTab(val);
          setSuccessBanner(null);
        }}
        sx={{ mb: 2.5, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          value="catalog"
          label={t("Daftar Harga Aktif (Live Catalog)")}
          icon={<PriceCheckIcon />}
          iconPosition="start"
          sx={{ fontWeight: 700 }}
        />
        <Tab
          value="versioning"
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span>{t("Riwayat Versi Dokumen (Document Versioning)")}</span>
              {versions && versions.length > 0 && (
                <Chip
                  label={versions.length}
                  size="small"
                  color="primary"
                  sx={{ height: 20, fontSize: "0.75rem", fontWeight: 700 }}
                />
              )}
            </Box>
          }
          icon={<HistoryIcon />}
          iconPosition="start"
          sx={{ fontWeight: 700 }}
        />
      </Tabs>

      {/* Success Notification */}
      {successBanner && (
        <Alert
          severity="success"
          onClose={() => setSuccessBanner(null)}
          sx={{ mb: 2.5, alignItems: "center" }}
        >
          {successBanner}
        </Alert>
      )}

      {/* TAB 1: LIVE CATALOG */}
      {activeTab === "catalog" && (
        <>
          {/* Filter Toolbar Card */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent sx={{ py: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel id="store-select-label">{t("Pilih Cabang Showroom")}</InputLabel>
                    <Select
                      labelId="store-select-label"
                      label={t("Pilih Cabang Showroom")}
                      value={activeStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                    >
                      {(stores ?? []).map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    type="date"
                    label={t("Berlaku Mulai Tanggal")}
                    value={validFromDate}
                    onChange={(e) => setValidFromDate(e.target.value)}
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                    sx={{ width: 190 }}
                  />

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t("Kelompokkan:")}
                    </Typography>
                    <ToggleButtonGroup
                      size="small"
                      value={groupBy}
                      exclusive
                      onChange={(_e, val) => {
                        if (val) setGroupBy(val);
                      }}
                    >
                      <ToggleButton value="category">{t("Kategori Jenis")}</ToggleButton>
                      <ToggleButton value="brand">{t("Merek / Distributor")}</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Box>

                <TextField
                  size="small"
                  placeholder={t("Cari merk, model, tipe...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ minWidth: 260 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              {/* Latest stored version badge banner */}
              {latestStoredVersion && (
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: "1px dashed",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <VerifiedIcon color="success" fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {t("Versi Tersimpan di Server:")} <strong>{latestStoredVersion.versionCode}</strong> {t("• Berlaku mulai")}{" "}
                      <strong>{formatLocalizedDate(latestStoredVersion.validFrom)}</strong> ({formatNumber(latestStoredVersion.itemCount)} {t("item,")}{" "}
                      {formatFileSize(latestStoredVersion.fileSizeBytes)})
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<FileDownloadIcon fontSize="small" />}
                    onClick={handleDownloadStoredVersion}
                    sx={{ textTransform: "none", py: 0 }}
                  >
                    {t("Unduh File Tersimpan")}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Loading & Error States */}
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {isError && (
            <Paper sx={{ p: 4, textAlign: "center", color: "error.main" }}>
              <Typography variant="body1">{t("Gagal memuat data daftar harga cabang.")}</Typography>
              <Button variant="outlined" sx={{ mt: 2 }} onClick={() => refetch()}>
                {t("Coba Lagi")}
              </Button>
            </Paper>
          )}

          {/* Price Tables */}
          {!isLoading && !isError && (
            <>
              {filteredGroups.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: "center", borderRadius: 2 }}>
                  <Typography variant="body1" color="text.secondary">
                    {t("Tidak ada produk atau data harga yang sesuai dengan pencarian.")}
                  </Typography>
                </Paper>
              ) : (
                filteredGroups.map((group) => (
                  <Box key={group.groupName} sx={{ mb: 4 }}>
                    {/* Group Title Banner */}
                    <Box
                      sx={{
                        backgroundColor: "primary.main",
                        color: "primary.contrastText",
                        px: 2,
                        py: 1,
                        borderRadius: "6px 6px 0 0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                        {group.groupName}
                      </Typography>
                      <Chip
                        label={t("{count} models", undefined, {
                          count: formatNumber(group.items.length),
                        })}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          color: "inherit",
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <TableContainer
                      component={Paper}
                      sx={{
                        borderRadius: "0 0 6px 6px",
                        border: "1px solid",
                        borderColor: "divider",
                        borderTop: "none",
                      }}
                    >
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: "action.hover" }}>
                          <TableRow>
                            <TableCell rowSpan={2} align="center" sx={{ width: 45, fontWeight: 700 }}>
                              {t("NO")}
                            </TableCell>
                            <TableCell rowSpan={2} sx={{ fontWeight: 700 }}>
                              {t("JENIS & MERK / NAMA BARANG")}
                            </TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ width: 140, fontWeight: 700 }}>
                              {t("KODE / SPECS")}
                            </TableCell>
                            <TableCell rowSpan={2} align="right" sx={{ width: 100, fontWeight: 700 }}>
                              {t("HD")}
                            </TableCell>
                            <TableCell rowSpan={2} align="right" sx={{ width: 90, fontWeight: 700 }}>
                              {t("DP")}
                            </TableCell>
                            <TableCell
                              colSpan={3}
                              align="center"
                              sx={{
                                fontWeight: 800,
                                borderLeft: "2px solid",
                                borderLeftColor: "divider",
                                backgroundColor: "primary.light",
                                color: "primary.contrastText",
                              }}
                            >
                              {t("ANGSURAN BULANAN (x Rp 1.000)")}
                            </TableCell>
                            <TableCell rowSpan={2} align="right" sx={{ width: 130, fontWeight: 700 }}>
                              {t("HARGA TUNAI")}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell
                              align="right"
                              sx={{
                                width: 90,
                                fontWeight: 800,
                                borderLeft: "2px solid",
                                borderLeftColor: "divider",
                              }}
                            >
                              {t("10 BLN")}
                            </TableCell>
                            <TableCell align="right" sx={{ width: 90, fontWeight: 800 }}>
                              {t("12 BLN")}
                            </TableCell>
                            <TableCell align="right" sx={{ width: 90, fontWeight: 800 }}>
                              {t("15 BLN")}
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.items.map((item, idx) => (
                            <TableRow
                              key={item.variantId}
                              hover
                              sx={{
                                "&:nth-of-type(even)": { backgroundColor: "action.hover" },
                              }}
                            >
                              <TableCell align="center" sx={{ color: "text.secondary" }}>
                                {idx + 1}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {item.displayName}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                  {item.sku}
                                </Typography>
                                {item.specifications && (
                                  <Typography variant="caption" sx={{ display: "block" }} color="text.secondary">
                                    {item.specifications}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                {formatThousands(item.hargaDasar)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                {item.downPayment > 0 ? (
                                  <Chip
                                    label={formatThousands(item.downPayment)}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: "0.75rem", fontFamily: "monospace" }}
                                  />
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  borderLeft: "2px solid",
                                  borderLeftColor: "divider",
                                  fontFamily: "monospace",
                                  fontWeight: 800,
                                  color: "primary.main",
                                }}
                              >
                                {formatThousands(item.installment10)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontFamily: "monospace",
                                  fontWeight: 800,
                                  color: "primary.main",
                                }}
                              >
                                {formatThousands(item.installment12)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontFamily: "monospace",
                                  fontWeight: 800,
                                  color: "primary.main",
                                }}
                              >
                                {formatThousands(item.installment15)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {item.cashPrice > 0 ? formatRupiah(item.cashPrice) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Section footer: Valid From date stamped at bottom right of each category/section */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1, pr: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ fontStyle: "italic", fontWeight: 700, color: "text.secondary" }}
                      >
                        {t("Berlaku mulai tanggal")} {formatLocalizedDate(validFromDate)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}

              {/* Footer explanation note */}
              <Box
                sx={{
                  mt: 4,
                  p: 2,
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  <strong>{t("Keterangan Format:")}</strong> {t("Nilai pada kolom HD, DP, 10 BLN, 12 BLN, dan 15 BLN dicantumkan dalam ribuan rupiah (contoh: 350 = Rp 350.000). Rumus angsuran menggunakan standard toko: Pokok = (HD - DP) + 30, Bunga Flat = 4%/bln, Diskon Angsuran = 15%, Pembulatan = Round(h4 / 5) * 5 + 5.")}
                </Typography>
              </Box>
            </>
          )}
        </>
      )}

      {/* TAB 2: DOCUMENT VERSIONING */}
      {activeTab === "versioning" && (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {t("Daftar Versi Dokumen Tersimpan (Document Archive)")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("Dokumen versi tersimpan dibekukan (frozen HTML) dan tersimpan di server. Pengunduhan langsung mengambil berkas arsip tanpa perlu proses hitung ulang. Anda dapat meninjau, mengunduh, atau menghapus arsip tertentu.")}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={() => setIsGenerateModalOpen(true)}
                disabled={!activeStoreId || generateAndStoreMutation.isPending}
              >
                {t("Generate Versi Baru")}
              </Button>
            </Box>

            {isVersionsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : !versions || versions.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: "center", bgcolor: "action.hover", borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t("Belum Ada Dokumen Versi Tersimpan")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t("Klik tombol di bawah untuk membuat dan menyimpan snapshot dokumen daftar harga pertama ke server.")}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setIsGenerateModalOpen(true)}
                >
                  {t("Generate & Simpan Versi Pertama")}
                </Button>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t("KODE VERSI")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("JUDUL DOKUMEN")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("TANGGAL BERLAKU")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("PENGELOMPOKAN")}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{t("TOTAL ITEM")}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{t("UKURAN")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("WAKTU DIBUAT")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("CATATAN")}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{t("AKSI")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {versions.map((ver) => (
                      <TableRow key={ver.id} hover>
                        <TableCell>
                          <Chip
                            label={ver.versionCode}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontFamily: "monospace" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {ver.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ver.fileName}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {formatLocalizedDate(ver.validFrom)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ver.groupBy === "category" ? t("Kategori") : t("Merek")}
                            size="small"
                            variant="filled"
                            sx={{ height: 22, fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {ver.itemCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {formatFileSize(ver.fileSizeBytes)}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                          {ver.createdAt ? formatDate(new Date(ver.createdAt), undefined, { dateStyle: "medium", timeStyle: "short" }) : "-"}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {ver.notes || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                            <Tooltip title={t("Lihat / Cetak Dokumen")}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => window.open(ver.viewUrl, "_blank")}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("Unduh Salinan HTML")}>
                              <IconButton
                                size="small"
                                color="success"
                                component="a"
                                href={ver.downloadUrl}
                                download={ver.fileName}
                              >
                                <FileDownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("Hapus Versi Ini")}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteVersion(ver)}
                                disabled={deleteVersionMutation.isPending}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Generate & Store New Version */}
      <Dialog
        open={isGenerateModalOpen}
        onClose={() => !generateAndStoreMutation.isPending && setIsGenerateModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t("Generate & Simpan Dokumen ke Server")}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {t("Sistem akan menghitung katalog harga dan membekukan (freeze) snapshot dokumen HTML langsung ke database server. Berkas akan otomatis terunduh begitu proses simpan selesai.")}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              type="date"
              label={t("Tanggal Berlaku (Valid From)")}
              value={validFromDate}
              onChange={(e) => setValidFromDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />

            <FormControl fullWidth size="small">
              <InputLabel id="dialog-group-label">{t("Pengelompokan Produk")}</InputLabel>
              <Select
                labelId="dialog-group-label"
                label={t("Pengelompokan Produk")}
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <MenuItem value="category">{t("Berdasarkan Kategori Jenis")}</MenuItem>
                <MenuItem value="brand">{t("Berdasarkan Merek / Distributor")}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={t("Catatan / Keterangan Versi (Opsional)")}
              placeholder={t("Contoh: Katalog harga promo Lebaran 2026, Penyesuaian harga Sharp...")}
              multiline
              rows={3}
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setIsGenerateModalOpen(false)}
            disabled={generateAndStoreMutation.isPending}
          >
            {t("Batal")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={handleConfirmGenerateAndStore}
            disabled={generateAndStoreMutation.isPending}
          >
            {generateAndStoreMutation.isPending
              ? t("Menyimpan & Mengunduh...")
              : t("Simpan & Unduh Otomatis")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
