import { apiClient } from "../../lib/apiClient";
import type {
  AutoApplyPricingPayload,
  DiscountCalculationResult,
  GeneratePriceListVersionRequest,
  PaymentPlan,
  PriceCalculationResponse,
  PriceDiscount,
  PriceDiscountInput,
  PriceListReport,
  PriceListVersion,
  StorePrice,
} from "./types";

export const pricingApi = {
  listByStore: (storeId: string) =>
    apiClient
      .get<StorePrice[]>(`/api/stores/${storeId}/pricing`)
      .then((r) => r.data),

  upsertPrice: (
    storeId: string,
    productVariantId: string,
    cashPrice: number,
    basePrice?: number,
    downPayment?: number
  ) =>
    apiClient
      .post<StorePrice>(`/api/stores/${storeId}/pricing`, {
        productVariantId,
        cashPrice,
        basePrice,
        downPayment,
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
    totalPrice: number
  ) =>
    apiClient
      .post<PaymentPlan>(`/api/stores/${storeId}/pricing/${priceId}/plans`, {
        termMonths,
        totalPrice,
      })
      .then((r) => r.data),

  calculatePreview: (
    storeId: string,
    data: {
      hargaDasar: number;
      downPayment?: number;
      termMonths?: number[];
    }
  ) =>
    apiClient
      .post<PriceCalculationResponse>(
        `/api/stores/${storeId}/pricing/calculate`,
        data
      )
      .then((r) => r.data),

  autoApplyPricing: (storeId: string, data: AutoApplyPricingPayload) =>
    apiClient
      .post<StorePrice>(`/api/stores/${storeId}/pricing/auto-apply`, data)
      .then((r) => r.data),

  autoApplyAllPricing: (storeId: string) =>
    apiClient
      .post<number>(`/api/stores/${storeId}/pricing/auto-apply-all`)
      .then((r) => r.data),

  getPriceList: (
    storeId: string,
    groupBy: string = "category",
    validFrom?: string
  ) =>
    apiClient
      .get<PriceListReport>(`/api/stores/${storeId}/pricing/price-list`, {
        params: { groupBy, validFrom },
      })
      .then((r) => r.data),

  generateAndStorePriceListVersion: (
    storeId: string,
    data?: GeneratePriceListVersionRequest
  ) =>
    apiClient
      .post<PriceListVersion>(
        `/api/stores/${storeId}/pricing/price-list/generate-and-store`,
        data ?? {}
      )
      .then((r) => r.data),

  listPriceListVersions: (storeId: string) =>
    apiClient
      .get<PriceListVersion[]>(`/api/stores/${storeId}/pricing/price-list/versions`)
      .then((r) => r.data),

  getLatestPriceListVersion: (storeId: string, groupBy?: string) =>
    apiClient
      .get<PriceListVersion | null>(`/api/stores/${storeId}/pricing/price-list/latest`, {
        params: { groupBy },
      })
      .then((r) => r.data),

  deletePriceListVersion: (storeId: string, versionId: string) =>
    apiClient
      .delete(`/api/stores/${storeId}/pricing/price-list/versions/${versionId}`)
      .then((r) => r.data),

  // Promotional Price Discounts
  listDiscounts: (storeId?: string, activeOnly?: boolean) =>
    apiClient
      .get<PriceDiscount[]>("/api/pricing/discounts", {
        params: { storeId, activeOnly },
      })
      .then((r) => r.data),

  getDiscount: (id: string) =>
    apiClient
      .get<PriceDiscount>(`/api/pricing/discounts/${id}`)
      .then((r) => r.data),

  createDiscount: (data: PriceDiscountInput) =>
    apiClient
      .post<PriceDiscount>("/api/pricing/discounts", data)
      .then((r) => r.data),

  updateDiscount: (id: string, data: PriceDiscountInput) =>
    apiClient
      .put<PriceDiscount>(`/api/pricing/discounts/${id}`, data)
      .then((r) => r.data),

  toggleActiveDiscount: (id: string) =>
    apiClient
      .post<PriceDiscount>(`/api/pricing/discounts/${id}/toggle-active`)
      .then((r) => r.data),

  deleteDiscount: (id: string) =>
    apiClient.delete(`/api/pricing/discounts/${id}`).then((r) => r.data),

  calculateDiscount: (data: {
    storeId?: string;
    productVariantId: string;
    productId?: string;
    basePrice: number;
    quantity?: number;
  }) =>
    apiClient
      .post<DiscountCalculationResult>("/api/pricing/discounts/calculate", data)
      .then((r) => r.data),
};
