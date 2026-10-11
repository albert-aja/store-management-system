import { apiClient } from "../../lib/apiClient";
import type { PaymentPlan, StorePrice } from "./types";

export const pricingApi = {
  listByStore: (storeId: string) =>
    apiClient
      .get<StorePrice[]>(`/api/stores/${storeId}/pricing`)
      .then((r) => r.data),
  upsertPrice: (storeId: string, productVariantId: string, cashPrice: number) =>
    apiClient
      .post<StorePrice>(`/api/stores/${storeId}/pricing`, {
        productVariantId,
        cashPrice,
      })
      .then((r) => r.data),
  listPlans: (storeId: string, priceId: string) =>
    apiClient
      .get<PaymentPlan[]>(`/api/stores/${storeId}/pricing/${priceId}/plans`)
      .then((r) => r.data),
  upsertPlan: (
    storeId: string,
    priceId: string,
    termMonths: number,
    totalPrice: number,
  ) =>
    apiClient
      .post<PaymentPlan>(`/api/stores/${storeId}/pricing/${priceId}/plans`, {
        termMonths,
        totalPrice,
      })
      .then((r) => r.data),
};
