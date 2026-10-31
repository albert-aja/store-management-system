export interface StorePrice {
  id: string;
  storeId: string;
  productVariantId: string;
  variantName: string;
  productName: string;
  cashPrice: number;
  basePrice?: number;
  downPayment?: number;
  active: boolean;
}

export interface PaymentPlan {
  id: string;
  termMonths: number;
  totalPrice: number;
  monthlyInstallment?: number;
  active: boolean;
}

export interface CalculatedTermItem {
  termMonths: number;
  monthlyInstallment: number;
  totalPrice: number;
}

export interface PriceCalculationResponse {
  hargaDasar: number;
  downPayment: number;
  autoDpApplied: boolean;
  terms: CalculatedTermItem[];
}

export interface AutoApplyPricingPayload {
  variantId: string;
  hargaDasar: number;
  downPayment?: number;
  cashPrice?: number;
  termMonths?: number[];
}

export interface PriceListItem {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  displayName: string;
  categoryName: string;
  brandName: string;
  specifications: string;
  cashPrice: number;
  hargaDasar: number;
  downPayment: number;
  installment10: number;
  installment12: number;
  installment15: number;
}

export interface PriceListGroup {
  groupName: string;
  items: PriceListItem[];
}

export interface PriceListReport {
  storeId: string;
  storeName: string;
  effectiveDate: string;
  groups: PriceListGroup[];
}

export interface PriceListVersion {
  id: string;
  storeId: string;
  storeName: string;
  versionCode: string;
  title: string;
  validFrom: string;
  groupBy: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  itemCount: number;
  notes?: string | null;
  createdAt: string;
  createdBy?: string | null;
  viewUrl: string;
  downloadUrl: string;
}

export interface GeneratePriceListVersionRequest {
  groupBy?: string;
  validFrom?: string;
  notes?: string;
}

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type DiscountScope = "UNIT" | "ORDER_TOTAL" | "BUNDLE";

export interface PriceDiscountRequirement {
  productVariantId: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  quantity: number;
}

export interface PriceDiscount {
  id: string;
  storeId: string | null;
  storeName: string | null;
  productId: string | null;
  productName: string | null;
  productVariantId: string | null;
  variantName: string | null;
  discountName: string;
  discountType: DiscountType;
  discountScope: DiscountScope;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  minQuantity: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  flashSale: boolean;
  priority: number;
  notes: string | null;
  requirements: PriceDiscountRequirement[];
  createdAt: string;
  updatedAt: string;
}

export interface PriceDiscountInput {
  storeId?: string | null;
  productId?: string | null;
  productVariantId?: string | null;
  discountName: string;
  discountType: DiscountType;
  discountScope?: DiscountScope;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  minQuantity?: number;
  validFrom: string;
  validUntil: string;
  active?: boolean;
  flashSale?: boolean;
  priority?: number;
  notes?: string | null;
  requirements?: PriceDiscountRequirement[];
}

export interface DiscountCalculationResult {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  appliedDiscountId: string | null;
  appliedDiscountName: string | null;
  discountType: DiscountType | null;
  isDiscounted: boolean;
}
