import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CalculateIcon from "@mui/icons-material/Calculate";
import AutoModeIcon from "@mui/icons-material/AutoMode";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../stores/hooks";
import {
  useAutoApplyPricing,
  useDeletePriceDiscount,
  usePaymentPlans,
  usePriceDiscounts,
  useStorePrices,
  useToggleActiveDiscount,
  useUpsertPlan,
  useUpsertPrice,
} from "./hooks";
import PriceDiscountDialog from "./PriceDiscountDialog";
import {
  calculatePriceMatrix,
  calculateInstallment,
  getSuggestedDp,
} from "../../lib/priceCalculator";
import type { ProductVariant } from "../products/types";
import type { StorePrice, PriceDiscount } from "./types";
import { formatCurrency, formatDate, formatNumber, t } from "../../lib/locale";

interface Props {
  variants: ProductVariant[];
  productId?: string;
}

function VariantPlans({
  storeId,
  price,
  variantId,
}: {
  storeId: string;
  price: StorePrice;
  variantId: string;
}) {
  const { data: plans } = usePaymentPlans(storeId, price.id);
  const upsertPlan = useUpsertPlan(storeId, price.id);
  const autoApply = useAutoApplyPricing(storeId);
  const canManage = useAuthStore((s) => s.hasPermission("PRICING_MANAGE"));

  const [termMonths, setTermMonths] = useState("");
  const [totalPrice, setTotalPrice] = useState("");

  // Auto-calculation reactive inputs
  const initialHd =
    price.basePrice && price.basePrice > 0 ? price.basePrice : price.cashPrice;
  const [hdInput, setHdInput] = useState<string>(String(initialHd || ""));
  const [dpInput, setDpInput] = useState<string>(
    price.downPayment !== undefined ? String(price.downPayment) : "",
  );

  const parsedHd = Number(hdInput) || 0;
  const suggestedDp = useMemo(() => getSuggestedDp(parsedHd), [parsedHd]);
  const parsedDp = dpInput !== "" ? Number(dpInput) : suggestedDp;

  // Real-time calculation matrix
  const liveMatrix = useMemo(() => {
    if (parsedHd <= 0) return null;
    return calculatePriceMatrix(parsedHd, parsedDp, [10, 12, 15]);
  }, [parsedHd, parsedDp]);

  const formatRupiah = (val: number) => formatCurrency(val);

  const handleApplyFormula = () => {
    if (!parsedHd) return;
    autoApply.mutate(
      {
        variantId,
        hargaDasar: parsedHd,
        downPayment: parsedDp,
        cashPrice: price.cashPrice || parsedHd,
        termMonths: [10, 12, 15],
      },
      {
        onSuccess: () => {
          alert(t("Successfully applied installment formula (10x, 12x, 15x)."));
        },
      },
    );
  };

  const handleQuickCalcCustomTerm = () => {
    const t = Number(termMonths);
    if (!t || !parsedHd) return;
    const res = calculateInstallment(parsedHd, parsedDp, t);
    setTotalPrice(String(res.totalPrice));
  };

  return (
    <Box
      sx={{
        pl: 2,
        mt: 1.5,
        pt: 1.5,
        borderTop: "1px dashed",
        borderColor: "divider",
      }}
    >
      {/* Formula Auto-Calculator Box */}
      {canManage && (
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            backgroundColor: "action.hover",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <CalculateIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t("Kalkulator Rumus Angsuran Retail Otomatis")}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1.5 }}
          >
            {t("Rumus resmi: Bunga flat 4%/bln, diskon angsuran 15%, pembulatan kelipatan Rp 5.000.")}</Typography>

          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              alignItems: "center",
              mb: 1.5,
            }}
          >
            <TextField
              label={t("Harga Dasar (HD)")}
              size="small"
              type="number"
              sx={{ width: 170 }}
              value={hdInput}
              onChange={(e) => setHdInput(e.target.value)}
              helperText={t("Biaya modal / HPP")}
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <TextField
                label={t("Down Payment (DP)")}
                size="small"
                type="number"
                sx={{ width: 170 }}
                value={dpInput}
                onChange={(e) => setDpInput(e.target.value)}
                placeholder={suggestedDp > 0 ? String(suggestedDp) : "0"}
              />
              {suggestedDp > 0 && dpInput !== String(suggestedDp) && (
                <Chip
                  label={t("Use Suggested Down Payment: {amount}", undefined, {
                    amount: formatRupiah(suggestedDp),
                  })}
                  size="small"
                  color="warning"
                  variant="outlined"
                  onClick={() => setDpInput(String(suggestedDp))}
                  sx={{ cursor: "pointer", fontSize: "0.7rem", height: 20 }}
                />
              )}
            </Box>

            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<AutoModeIcon />}
              onClick={handleApplyFormula}
              disabled={parsedHd <= 0 || autoApply.isPending}
            >
              {autoApply.isPending
                ? t("Menerapkan...")
                : t("Terapkan Rumus (10x, 12x, 15x)")}
            </Button>
          </Box>

          {/* Live Preview Cards */}
          {liveMatrix && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
              {liveMatrix.terms.map((term) => (
                <Chip
                  key={term.termMonths}
                  label={t("{months} mo.: {monthly} /mo. (Total {total})", undefined, {
                    months: formatNumber(term.termMonths),
                    monthly: formatRupiah(term.monthlyInstallment),
                    total: formatRupiah(term.totalPrice),
                  })}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontFamily: "monospace" }}
                />
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Configured Payment Plans List */}
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: "text.secondary" }}
      >
        {t("SKEMA TENOR AKTIF SAAT INI:")}
      </Typography>
      <List dense sx={{ py: 0.5 }}>
        {(plans ?? []).map((plan) => {
          const monthly =
            plan.monthlyInstallment ||
            (plan.termMonths > 0
              ? Math.round(plan.totalPrice / plan.termMonths)
              : plan.totalPrice);
          return (
            <ListItem key={plan.id} sx={{ py: 0.25, px: 0 }}>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    <strong>
                      {plan.termMonths === 0
                        ? t("Tunai / Cash")
                        : t("Installment {months} months", undefined, {
                            months: plan.termMonths,
                          })}
                    </strong>
                    :{" "}
                    <span style={{ color: "#0284c7", fontWeight: 700 }}>
                      {formatRupiah(monthly)} {t("/bulan")}
                    </span>{" "}
                    <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                      {t("(Total Pembiayaan:")} {formatRupiah(plan.totalPrice)})
                    </span>
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>

      {/* Manual / Custom Tenor Entry */}
      {canManage && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            mt: 1.5,
            flexWrap: "wrap",
          }}
        >
          <TextField
            label={t("Tenor (Bulan)")}
            size="small"
            type="number"
            sx={{ width: 120 }}
            value={termMonths}
            onChange={(e) => setTermMonths(e.target.value)}
          />
          <TextField
            label={t("Total Harga (Rp)")}
            size="small"
            type="number"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
          />
          <Button
            size="small"
            variant="text"
            onClick={handleQuickCalcCustomTerm}
            disabled={!termMonths || !parsedHd}
          >
            {t("Hitung Rumus")}
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              if (!termMonths || !totalPrice) return;
              upsertPlan.mutate({
                termMonths: Number(termMonths),
                totalPrice: Number(totalPrice),
              });
              setTermMonths("");
              setTotalPrice("");
            }}
          >
            {t("Simpan Tenor Manual")}
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function PricingPanel({ variants, productId }: Props) {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const { data: prices } = useStorePrices(storeId || null);
  const { data: discounts } = usePriceDiscounts(storeId || undefined);
  const upsertPrice = useUpsertPrice(storeId);
  const toggleActiveDiscount = useToggleActiveDiscount();
  const deleteDiscount = useDeletePriceDiscount();

  const canManage = useAuthStore((s) => s.hasPermission("PRICING_MANAGE"));
  const [cashInputs, setCashInputs] = useState<Record<string, string>>({});
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountToEdit, setDiscountToEdit] = useState<PriceDiscount | null>(
    null,
  );

  const formatRupiah = (val: number) => formatCurrency(val);

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {t("Manajemen Harga & Diskon Toko")}
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_e, val) => setActiveTab(val)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab label={t("Harga Tunai & Tenor")} />
        <Tab label={t("Diskon Promo Toko")} />
      </Tabs>

      {/* Tab 0: Cash & Payment Plans */}
      {activeTab === 0 && (
        <Box>
          <TextField
            select
            label={t("Pilih Cabang Showroom")}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
          >
            {(stores ?? []).map((store) => (
              <MenuItem key={store.id} value={store.id}>
                {store.name}
              </MenuItem>
            ))}
          </TextField>

          {!storeId ? (
            <Typography variant="body2" color="text.secondary">
              {t("Pilih cabang toko untuk melihat dan mengatur matriks harga jual tunai dan tenor cicilan.")}</Typography>
          ) : (
            variants.map((variant) => {
              const price = (prices ?? []).find(
                (p) => p.productVariantId === variant.id,
              );
              return (
                <Box
                  key={variant.id}
                  sx={{
                    mb: 2,
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      sx={{
                        width: 140,
                        fontWeight: "medium",
                        fontSize: "0.875rem",
                      }}
                    >
                      {variant.variantName || variant.sku}
                    </Typography>
                    <TextField
                      label={t("Harga Tunai (Rp)")}
                      size="small"
                      type="number"
                      sx={{ width: 140 }}
                      value={cashInputs[variant.id] ?? price?.cashPrice ?? ""}
                      onChange={(e) =>
                        setCashInputs((prev) => ({
                          ...prev,
                          [variant.id]: e.target.value,
                        }))
                      }
                      disabled={!canManage}
                    />
                    {canManage && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          const value = Number(
                            cashInputs[variant.id] ?? price?.cashPrice ?? 0,
                          );
                          if (!value) return;
                          upsertPrice.mutate({
                            productVariantId: variant.id,
                            cashPrice: value,
                          });
                        }}
                      >
                        {t("Simpan")}
                      </Button>
                    )}
                    {price && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          setExpandedVariant(
                            expandedVariant === variant.id ? null : variant.id,
                          )
                        }
                      >
                        {expandedVariant === variant.id
                          ? t("Tutup Tenor & Rumus")
                          : t("Kelola Tenor & Rumus")}
                      </Button>
                    )}
                  </Box>
                  {price && expandedVariant === variant.id && (
                    <VariantPlans
                      storeId={storeId}
                      price={price}
                      variantId={variant.id}
                    />
                  )}
                </Box>
              );
            })
          )}
        </Box>
      )}

      {/* Tab 1: Promotional Price Discounts */}
      {activeTab === 1 && (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("Atur diskon harga promo berlaku waktu, bertingkat persentase atau nominal langsung.")}</Typography>
            {canManage && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setDiscountDialogOpen(true)}
              >
                {t("Buat Promo")}
              </Button>
            )}
          </Box>

          {!discounts || discounts.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 3, textAlign: "center", bgcolor: "background.default" }}
            >
              <LocalOfferIcon
                sx={{
                  color: "text.secondary",
                  fontSize: 36,
                  mb: 1,
                  opacity: 0.5,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {t("Belum ada diskon promosi terdaftar untuk cabang ini.")}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {discounts.map((discount) => {
                const now = new Date();
                const from = new Date(discount.validFrom);
                const until = new Date(discount.validUntil);
                let scheduleStatus: {
                  label: string;
                  color: "success" | "info" | "warning" | "default";
                } = { label: t("Aktif"), color: "success" };

                if (!discount.active) {
                  scheduleStatus = { label: t("Nonaktif"), color: "default" };
                } else if (now < from) {
                  scheduleStatus = { label: t("Terjadwal"), color: "info" };
                } else if (now > until) {
                  scheduleStatus = { label: t("Kedaluwarsa"), color: "warning" };
                }

                return (
                  <Paper
                    key={discount.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: "4px solid",
                      borderLeftColor:
                        scheduleStatus.color === "success"
                          ? "success.main"
                          : scheduleStatus.color === "info"
                            ? "info.main"
                            : scheduleStatus.color === "warning"
                              ? "warning.main"
                              : "text.disabled",
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: "bold" }}
                        >
                          {discount.discountName}
                        </Typography>
                        <Chip
                          label={
                            discount.discountType === "PERCENTAGE"
                              ? t("Discount {value}", undefined, {
                                  value: `${formatNumber(discount.discountValue)}%`,
                                })
                              : t("Discount {value}", undefined, {
                                  value: formatRupiah(discount.discountValue),
                                })
                          }
                          size="small"
                          color={
                            scheduleStatus.color === "success"
                              ? "success"
                              : "default"
                          }
                          variant="outlined"
                        />
                        <Chip
                          label={scheduleStatus.label}
                          size="small"
                          color={scheduleStatus.color}
                          sx={{
                            height: 20,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {t("Min. Beli:")} {discount.minQuantity} {t("unit")}
                        {discount.minOrderAmount > 0 &&
                          ` | ${t("Minimum order: {amount}", undefined, {
                            amount: formatRupiah(discount.minOrderAmount),
                          })}`}
                        {discount.maxDiscountAmount &&
                          ` | ${t("Maximum discount: {amount}", undefined, {
                            amount: formatRupiah(discount.maxDiscountAmount),
                          })}`}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {t("Periode:")} {formatDate(from, undefined, { dateStyle: "medium" })} {t("s/d")}{" "}
                        {formatDate(until, undefined, { dateStyle: "medium" })}
                      </Typography>
                    </Box>

                    {canManage && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          title={t("Ubah Promo / Periode Validitas")}
                          onClick={() => {
                            setDiscountToEdit(discount);
                            setDiscountDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <Button
                          size="small"
                          variant="outlined"
                          color={discount.active ? "warning" : "success"}
                          onClick={() =>
                            toggleActiveDiscount.mutate(discount.id)
                          }
                        >
                          {discount.active ? t("Nonaktifkan") : t("Aktifkan")}
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (
                              confirm(
                                t("Delete promotional discount \"{name}\"?", undefined, { name: discount.discountName }),
                              )
                            ) {
                              deleteDiscount.mutate(discount.id);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}

          <PriceDiscountDialog
            key={`${discountToEdit?.id ?? "new"}-${discountDialogOpen}`}
            open={discountDialogOpen}
            onClose={() => {
              setDiscountDialogOpen(false);
              setDiscountToEdit(null);
            }}
            variants={variants}
            stores={stores ?? []}
            storeId={storeId || undefined}
            productId={productId}
            initialData={discountToEdit}
          />
        </Box>
      )}
    </div>
  );
}
