import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pricingApi } from "./api";

const pricesKey = (storeId: string) => ["store-prices", storeId];
const plansKey = (storeId: string, priceId: string) => [
  "store-price-plans",
  storeId,
  priceId,
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
    }: {
      productVariantId: string;
      cashPrice: number;
    }) => pricingApi.upsertPrice(storeId, productVariantId, cashPrice),
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
