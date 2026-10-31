export interface ProductSummary {
  id: string;
  name: string;
  code: string;
  description: string;
  brandName: string;
  categoryName: string;
  minPrice: number;
  maxPrice: number;
  primaryImageUrl: string;
  commercialAvailability:
    | "IN_STOCK"
    | "AVAILABLE_PROCUREMENT_REQUIRED"
    | "PREORDER";
  leadTimeDays: number;
  inStockCount: number;
  originalMinPrice?: number;
  hasDiscount?: boolean;
  maxDiscountPercent?: number;
  discountLabel?: string;
  flashSale?: boolean;
  flashSaleEndsAt?: string | null;
  primaryVariantId?: string | null;
}

export interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockCount: number;
  commercialAvailability: string;
  leadTimeDays: number;
  attributes: Record<string, string>;
  originalPrice?: number;
  discountAmount?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
  discountLabel?: string;
  flashSale?: boolean;
  flashSaleEndsAt?: string | null;
}

export interface ProductDetail extends ProductSummary {
  imageUrls: string[];
  totalStockCount: number;
  variants: Variant[];
  specifications: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  imageUrl: string;
  productCount: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  imageUrl: string;
  targetUrl: string;
  ctaText: string;
}

export interface CartItem {
  itemId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl: string;
  commercialAvailability: string;
  originalUnitPrice?: number;
  discountAmount?: number;
  hasDiscount?: boolean;
  discountLabel?: string;
  flashSale?: boolean;
  flashSaleEndsAt?: string | null;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  totalItemCount: number;
  subtotalAmount: number;
  totalDiscountAmount?: number;
  orderDiscountAmount?: number;
  orderDiscountLabel?: string | null;
  estimatedTax: number;
  totalAmount: number;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  enabled: boolean;
  requiresApproval: boolean;
  displayOrder: number;
}

export interface PickupBranch {
  id: string;
  code: string;
  name: string;
  address: string;
  active: boolean;
}

export interface FulfillmentItem {
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  isProcurementRequired: boolean;
  procurementStatus: string;
}

export interface FulfillmentGroupSummary {
  groupId: string;
  groupNumber: number;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  status: string;
  pickupStoreName?: string;
  estimatedDeliveryDate?: string;
  items: FulfillmentItem[];
}

export interface CheckoutResponse {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  requiredDepositAmount: number;
  depositPaid: boolean;
  paymentMethod: string;
  paymentInstructions: {
    method: string;
    qrCodeString?: string;
    vaNumber?: string;
    bankName?: string;
    amountDue: number;
    expiryTime: string;
    instructions: string;
  };
  fulfillmentPreference: "COMPLETE" | "PARTIAL";
  fulfillmentGroups: FulfillmentGroupSummary[];
}

export interface OrderTimelineEvent {
  milestone: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface OrderDetail {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  requiredDepositAmount: number;
  depositPaid: boolean;
  paymentMethod: string;
  fulfillmentPreference: string;
  customerName: string;
  customerPhone: string;
  deliveryAddressSnapshot: string;
  customerNotes?: string;
  fulfillmentGroups: FulfillmentGroupSummary[];
  timeline: OrderTimelineEvent[];
}

export interface CustomerProfile {
  customerId: string;
  email: string;
  fullName: string;
  phone: string | null;
}

export interface PickupPass {
  orderNumber: string;
  fulfillmentGroupId: string;
  groupNumber: number;
  pickupStoreId: string;
  pickupStoreCode: string;
  pickupStoreName: string;
  pickupStoreAddress: string;
  operatingHours: string;
  contactPhone: string;
  pickupPassCode: string;
  qrPayload: string;
  stagingStatus: string;
  stagingRackLocation: string;
  stagedAt?: string;
  handedOverAt?: string;
  handedOverByStaffName?: string;
  recipientName: string;
  recipientPhone: string;
  totalAmount: number;
  requiredDepositAmount: number;
  depositPaid: boolean;
  remainingBalance: number;
  fullyPaid: boolean;
  readyForCollection: boolean;
  items: {
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    procurementRequired: boolean;
  }[];
}

export interface StagePickupData {
  orderNumber: string;
  groupNumber?: number;
  stagingRackLocation: string;
  stagedByStaffName?: string;
  notes?: string;
}

export interface VerifyHandoverData {
  pickupPassCode: string;
  staffEmployeeName: string;
  recipientIdentityName?: string;
  recipientPhone?: string;
  handoverNotes?: string;
  settleRemainingBalance?: boolean;
}

export interface HandoverResult {
  success: boolean;
  orderNumber: string;
  groupNumber: number;
  fulfillmentGroupId: string;
  pickupPassCode: string;
  handedOverAt: string;
  staffEmployeeName: string;
  customerName: string;
  recipientIdentityName: string;
  settledAmount: number;
  message: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  categoryName: string;
  brandName: string;
  primaryImageUrl: string;
  commercialAvailability:
    | "IN_STOCK"
    | "AVAILABLE_PROCUREMENT_REQUIRED"
    | "PREORDER";
  leadTimeDays: number;
  inStockCount: number;
  originalAddedPrice: number;
  currentPrice: number;
  hasPriceDrop: boolean;
  priceDropAmount: number;
  priceDropPercentage: number;
  notes?: string;
  addedAt: string;
}

export interface WishlistSummary {
  items: WishlistItem[];
  totalItems: number;
  priceDropCount: number;
  totalPotentialSavings: number;
}
export interface DeliveryRescheduleRequest {
  id: string;
  requestedDate: string;
  requestedWindow: "MORNING" | "AFTERNOON";
  status: "PENDING" | "APPROVED" | "REJECTED";
  decisionNotes: string | null;
}

export interface DeliverySchedule {
  deliveryOrderId: string;
  deliveryOrderNumber: string;
  plannedDispatchAt: string | null;
  deliveryDate: string | null;
  deliveryWindow: "MORNING" | "AFTERNOON" | null;
  eligible: boolean;
  unavailableReason: string | null;
  requests: DeliveryRescheduleRequest[];
}
