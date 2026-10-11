export interface StorePrice {
  id: string;
  storeId: string;
  productVariantId: string;
  variantName: string;
  productName: string;
  cashPrice: number;
  active: boolean;
}

export interface PaymentPlan {
  id: string;
  termMonths: number;
  totalPrice: number;
  active: boolean;
}
