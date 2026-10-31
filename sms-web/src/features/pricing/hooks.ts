import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pricingApi } from "./api";
import type {
  AutoApplyPricingPayload,
  GeneratePriceListVersionRequest,
  PriceDiscountInput,
} from "./types";

const pricesKey = (storeId: string) => ["store-prices", storeId];
const plansKey = (storeId: string, priceId: string) => [
  "store-price-plans",
  storeId,
  priceId,
];
const discountsKey = (storeId?: string, activeOnly?: boolean) => [
  "price-discounts",
  storeId ?? "all",
  activeOnly ? "active" : "all",
];
const priceListKey = (storeId: string, groupBy: string, validFrom?: string) => [
  "price-list",
  storeId,
  groupBy,
  validFrom ?? "current",
];
const priceListVersionsKey = (storeId: string) => [
  "price-list-versions",
  storeId,
];
const latestPriceListVersionKey = (storeId: string, groupBy?: string) => [
  "latest-price-list-version",
  storeId,
  groupBy ?? "all",
];

export function useStorePrices(storeId: string | null) {
  return useQuery({
    queryKey: pricesKey(storeId ?? ""),
    queryFn: () => pricingApi.listByStore(storeId as string),
    enabled: !!storeId,
  });
}

export function useUpsertPrice(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productVariantId,
      cashPrice,
      basePrice,
      downPayment,
    }: {
      productVariantId: string;
      cashPrice: number;
      basePrice?: number;
      downPayment?: number;
    }) =>
      pricingApi.upsertPrice(
        storeId,
        productVariantId,
        cashPrice,
        basePrice,
        downPayment
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: pricesKey(storeId) }),
  });
}

export function usePaymentPlans(storeId: string, priceId: string | null) {
  return useQuery({
    queryKey: plansKey(storeId, priceId ?? ""),
    queryFn: () => pricingApi.listPlans(storeId, priceId as string),
    enabled: !!priceId,
  });
}

export function useUpsertPlan(storeId: string, priceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      termMonths,
      totalPrice,
    }: {
      termMonths: number;
      totalPrice: number;
    }) => pricingApi.upsertPlan(storeId, priceId, termMonths, totalPrice),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: plansKey(storeId, priceId) }),
  });
}

export function useAutoApplyPricing(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AutoApplyPricingPayload) =>
      pricingApi.autoApplyPricing(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricesKey(storeId) });
      queryClient.invalidateQueries({ queryKey: ["store-price-plans"] });
      queryClient.invalidateQueries({ queryKey: ["price-list"] });
    },
  });
}

export function useAutoApplyAllPricing(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => pricingApi.autoApplyAllPricing(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricesKey(storeId) });
      queryClient.invalidateQueries({ queryKey: ["store-price-plans"] });
      queryClient.invalidateQueries({ queryKey: ["price-list"] });
    },
  });
}

export function usePriceList(
  storeId: string | null,
  groupBy: string = "category",
  validFrom?: string
) {
  return useQuery({
    queryKey: priceListKey(storeId ?? "", groupBy, validFrom),
    queryFn: () => pricingApi.getPriceList(storeId as string, groupBy, validFrom),
    enabled: !!storeId,
  });
}

export function usePriceListVersions(storeId: string | null) {
  return useQuery({
    queryKey: priceListVersionsKey(storeId ?? ""),
    queryFn: () => pricingApi.listPriceListVersions(storeId as string),
    enabled: !!storeId,
  });
}

export function useLatestPriceListVersion(storeId: string | null, groupBy?: string) {
  return useQuery({
    queryKey: latestPriceListVersionKey(storeId ?? "", groupBy),
    queryFn: () => pricingApi.getLatestPriceListVersion(storeId as string, groupBy),
    enabled: !!storeId,
  });
}

export function useGenerateAndStorePriceListVersion(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: GeneratePriceListVersionRequest) =>
      pricingApi.generateAndStorePriceListVersion(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceListVersionsKey(storeId) });
      queryClient.invalidateQueries({ queryKey: ["latest-price-list-version", storeId] });
    },
  });
}

export function useDeletePriceListVersion(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      pricingApi.deletePriceListVersion(storeId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceListVersionsKey(storeId) });
      queryClient.invalidateQueries({ queryKey: ["latest-price-list-version", storeId] });
    },
  });
}

// Promotional Price Discount Hooks
export function usePriceDiscounts(storeId?: string, activeOnly?: boolean) {
  return useQuery({
    queryKey: discountsKey(storeId, activeOnly),
    queryFn: () => pricingApi.listDiscounts(storeId, activeOnly),
  });
}

export function useCreatePriceDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PriceDiscountInput) => pricingApi.createDiscount(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["price-discounts"] }),
  });
}

export function useUpdatePriceDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PriceDiscountInput }) =>
      pricingApi.updateDiscount(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["price-discounts"] }),
  });
}

export function useToggleActiveDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pricingApi.toggleActiveDiscount(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["price-discounts"] }),
  });
}

export function useDeletePriceDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pricingApi.deleteDiscount(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["price-discounts"] }),
  });
}
