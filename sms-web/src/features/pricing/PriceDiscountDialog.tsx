import { t } from "../../lib/locale";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useCreatePriceDiscount, useUpdatePriceDiscount } from "./hooks";
import type {
  DiscountScope,
  DiscountType,
  PriceDiscount,
  PriceDiscountRequirement,
} from "./types";
import type { ProductVariant } from "../products/types";
import { productsApi } from "../products/api";

interface Props {
  open: boolean;
  onClose: () => void;
  variants: ProductVariant[];
  productId?: string;
  stores?: { id: string; name: string }[];
  storeId?: string;
  initialData?: PriceDiscount | null;
}

export default function PriceDiscountDialog({
  open,
  onClose,
  variants = [],
  productId,
  stores = [],
  storeId: initialStoreId,
  initialData,
}: Props) {
  const createDiscount = useCreatePriceDiscount();
  const updateDiscount = useUpdatePriceDiscount();

  const [discountName, setDiscountName] = useState(
    initialData?.discountName ?? "",
  );
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialData?.discountType ?? "PERCENTAGE",
  );
  const [discountScope, setDiscountScope] = useState<DiscountScope>(
    initialData?.discountScope ?? "UNIT",
  );
  const [flashSale, setFlashSale] = useState(initialData?.flashSale ?? false);
  const [requirements, setRequirements] = useState<PriceDiscountRequirement[]>(
    initialData?.requirements?.length
      ? initialData.requirements
      : [
          { productVariantId: "", quantity: 1 },
          { productVariantId: "", quantity: 1 },
        ],
  );
  const [discountValue, setDiscountValue] = useState(
    initialData ? String(initialData.discountValue) : "",
  );
  const [variantId, setVariantId] = useState(
    initialData?.productVariantId ?? "",
  );
  const [storeId, setStoreId] = useState(
    initialData?.storeId || initialStoreId || "",
  );
  const [minOrderAmount, setMinOrderAmount] = useState(
    initialData?.minOrderAmount ? String(initialData.minOrderAmount) : "",
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(
    initialData?.maxDiscountAmount ? String(initialData.maxDiscountAmount) : "",
  );
  const [minQuantity, setMinQuantity] = useState(
    String(initialData?.minQuantity ?? 1),
  );
  const [validFrom, setValidFrom] = useState(
    initialData?.validFrom
      ? new Date(initialData.validFrom).toISOString().slice(0, 10)
      : "",
  );
  const [validUntil, setValidUntil] = useState(
    initialData?.validUntil
      ? new Date(initialData.validUntil).toISOString().slice(0, 10)
      : "",
  );
  const [priority, setPriority] = useState(String(initialData?.priority ?? 10));
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const bundleProducts = useQuery({
    queryKey: ["discount-bundle-products"],
    queryFn: () => productsApi.search(""),
    enabled: open && discountScope === "BUNDLE",
  });
  const bundleVariants = useQuery({
    queryKey: [
      "discount-bundle-variants",
      bundleProducts.data?.map((product) => product.id),
    ],
    queryFn: async () =>
      Promise.all(
        (bundleProducts.data ?? []).map(async (product) =>
          (await productsApi.listVariants(product.id)).map((variant) => ({
            ...variant,
            productName: product.name,
          })),
        ),
      ).then((groups) => groups.flat()),
    enabled:
      open && discountScope === "BUNDLE" && !!bundleProducts.data?.length,
  });

  const isSubmitting = createDiscount.isPending || updateDiscount.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountName || !discountValue || !validFrom || !validUntil) return;

    const payload = {
      discountName,
      discountType,
      discountScope,
      flashSale: discountScope === "UNIT" && flashSale,
      discountValue: Number(discountValue),
      productId: discountScope === "BUNDLE" ? null : productId || null,
      productVariantId: discountScope === "BUNDLE" ? null : variantId || null,
      storeId: storeId || null,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscountAmount:
        discountType === "PERCENTAGE" && maxDiscountAmount
          ? Number(maxDiscountAmount)
          : null,
      minQuantity: minQuantity ? Number(minQuantity) : 1,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil + "T23:59:59").toISOString(),
      priority: priority ? Number(priority) : 0,
      notes: notes || null,
      requirements:
        discountScope === "BUNDLE"
          ? requirements
              .filter((requirement) => requirement.productVariantId)
              .map((requirement) => ({
                productVariantId: requirement.productVariantId,
                quantity: Number(requirement.quantity),
              }))
          : [],
    };

    if (initialData?.id) {
      updateDiscount.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            onClose();
          },
        },
      );
    } else {
      createDiscount.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData
            ? t("Ubah Diskon Promo")
            : t("Buat Diskon Promo Baru")}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label={t("Nama Promo / Kampanye")}
            required
            fullWidth
            size="small"
            placeholder={t("Contoh: Promo Weekend Elektronik 15%")}
            value={discountName}
            onChange={(e) => setDiscountName(e.target.value)}
          />

          <FormControl fullWidth size="small">
            <InputLabel>{t("Ruang Lingkup")}</InputLabel>
            <Select
              value={discountScope}
              label={t("Ruang Lingkup")}
              onChange={(e) =>
                setDiscountScope(e.target.value as DiscountScope)
              }
            >
              <MenuItem value="UNIT">{t("Per unit / tingkat jumlah")}</MenuItem>
              <MenuItem value="ORDER_TOTAL">
                {t("Potongan sekali per pesanan")}
              </MenuItem>
              <MenuItem value="BUNDLE">{t("Bundel beberapa produk")}</MenuItem>
            </Select>
          </FormControl>

          {discountScope === "BUNDLE" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t("Promo berlaku untuk setiap set lengkap yang memenuhi semua varian dan jumlah.")}</Typography>
              {requirements.map((requirement, index) => (
                <Box key={index} sx={{ display: "flex", gap: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("Varian Bundel")}</InputLabel>
                    <Select
                      value={requirement.productVariantId}
                      label={t("Varian Bundel")}
                      onChange={(e) =>
                        setRequirements((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, productVariantId: e.target.value }
                              : item,
                          ),
                        )
                      }
                    >
                      {(bundleVariants.data ?? []).map((variant) => (
                        <MenuItem key={variant.id} value={variant.id}>
                          {variant.productName} ·{" "}
                          {variant.variantName || variant.sku}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label={t("Jumlah")}
                    type="number"
                    size="small"
                    sx={{ width: 110 }}
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={requirement.quantity}
                    onChange={(e) =>
                      setRequirements((current) =>
                        current.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                quantity: Math.max(1, Number(e.target.value)),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                  <Button
                    color="error"
                    disabled={requirements.length <= 2}
                    onClick={() =>
                      setRequirements((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    {t("Hapus")}
                  </Button>
                </Box>
              ))}
              <Button
                onClick={() =>
                  setRequirements((current) => [
                    ...current,
                    { productVariantId: "", quantity: 1 },
                  ])
                }
              >
                {t("Tambah produk bundel")}
              </Button>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("Tipe Diskon")}</InputLabel>
              <Select
                value={discountType}
                label={t("Tipe Diskon")}
                onChange={(e) =>
                  setDiscountType(e.target.value as DiscountType)
                }
              >
                <MenuItem value="PERCENTAGE">{t("Persentase (%)")}</MenuItem>
                <MenuItem value="FIXED_AMOUNT">{t("Nominal Potongan (Rp)")}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={
                discountType === "PERCENTAGE"
                  ? t("Nilai Diskon (%)")
                  : t("Nilai Diskon (Rp)")
              }
              required
              fullWidth
              size="small"
              type="number"
              placeholder={discountType === "PERCENTAGE" ? "10" : "100000"}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </Box>

          {discountScope === "UNIT" && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={flashSale}
                  onChange={(event) => setFlashSale(event.target.checked)}
                />
              }
              label={t("Flash Sale: tampilkan hitung mundur dan stok tersedia")}
            />
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("Target Varian")}</InputLabel>
              <Select
                value={variantId}
                label={t("Target Varian")}
                onChange={(e) => setVariantId(e.target.value)}
              >
                <MenuItem value="">{t("Semua Varian Produk Ini")}</MenuItem>
                {variants.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.variantName} ({v.sku})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {stores && stores.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>{t("Cabang Berlaku")}</InputLabel>
                <Select
                  value={storeId}
                  label={t("Cabang Berlaku")}
                  onChange={(e) => setStoreId(e.target.value)}
                >
                  <MenuItem value="">{t("Semua Cabang (Omnichannel)")}</MenuItem>
                  {stores.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={t("Min. Belanja (Rp)")}
              fullWidth
              size="small"
              type="number"
              placeholder="0"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
            />

            {discountType === "PERCENTAGE" && (
              <TextField
                label={t("Maksimal Potongan Diskon (Rp)")}
                fullWidth
                size="small"
                type="number"
                placeholder={t("Tanpa Batas")}
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
              />
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={t("Berlaku Mulai (Valid From)")}
              type="date"
              required
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
            <TextField
              label={t("Berlaku Hingga (Valid To)")}
              type="date"
              required
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={t("Minimal Qty")}
              type="number"
              fullWidth
              size="small"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
            />
            <TextField
              label={t("Prioritas (Angka lebih tinggi = didahulukan)")}
              type="number"
              fullWidth
              size="small"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </Box>

          <TextField
            label={t("Catatan / Syarat Ketentuan Promo")}
            fullWidth
            size="small"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>{t("Batal")}</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting
              ? t("Menyimpan...")
              : initialData
                ? t("Simpan Perubahan")
                : t("Simpan Diskon Promo")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
