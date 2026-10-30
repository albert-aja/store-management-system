export interface Customer {
  id: string;
  fullName: string;
  nik: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  active: boolean;
  segment?: string;
  creditScoreGrade?: string;
  creditScorePoints?: number;
  clvAmount?: number;
  totalOrdersCount?: number;
  motherMaidenName?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
}

export interface CustomerInput {
  fullName: string;
  nik?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  salesOrderId?: string;
  creationContext?: string;
  motherMaidenName?: string;
  birthDate?: string;
  birthPlace?: string;
}

export interface CustomerContact {
  id: string;
  contactType: string;
  label: string | null;
  value: string;
  notes: string | null;
  active: boolean;
}

export interface ContactInput {
  contactType: string;
  label?: string;
  value: string;
  notes?: string;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  addressLine: string;
  notes: string | null;
  primary: boolean;
  active: boolean;
}

export interface AddressInput {
  label?: string;
  addressLine: string;
  notes?: string;
  primary: boolean;
}

// --- Customer 360 & CRM Interfaces ---

export interface CustomerTagItem {
  id: string;
  tagName: string;
  color: string;
}

export interface TimelineEventItem {
  id: string;
  eventType: string; // SALES_ORDER, SURVEY, DELIVERY, PAYMENT, REPOSSESSION, INTERACTION, PTP, FOLLOW_UP, STORE_CREDIT
  title: string;
  description: string;
  status: string;
  timestamp: string;
  referenceCode?: string;
  referenceId?: string;
  badgeColor?: string;
}

export interface Customer360Summary {
  customerId: string;
  fullName: string;
  nik: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  motherMaidenName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  segment: string;
  creditScoreGrade: string;
  creditScorePoints: number;
  clvAmount: number;
  totalOrdersCount: number;
  storeCreditBalance: number;
  activeVouchersCount: number;
  pendingPtpCount: number;
  pendingFollowUpsCount: number;
  tags: CustomerTagItem[];
  timeline: TimelineEventItem[];
}

export type InteractionChannel = "IN_PERSON" | "PHONE_CALL" | "WHATSAPP" | "SMS" | "EMAIL";
export type InteractionDirection = "INBOUND" | "OUTBOUND";
export type InteractionOutcome = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "NO_ANSWER" | "FOLLOW_UP_REQUIRED";

export interface CustomerInteractionItem {
  id: string;
  customerId: string;
  channel: InteractionChannel;
  direction: InteractionDirection;
  summary: string;
  details?: string;
  outcome: InteractionOutcome;
  recordedByName: string;
  createdAt: string;
}

export interface InteractionInput {
  channel: InteractionChannel;
  direction: InteractionDirection;
  summary: string;
  details?: string;
  outcome: InteractionOutcome;
}

export type FollowUpType = "SALES_LEAD" | "PAYMENT_REMINDER" | "SERVICE_CHECKIN" | "GENERAL";
export type FollowUpStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "OVERDUE";

export interface CustomerFollowUpItem {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  followUpType: FollowUpType;
  scheduledAt: string;
  assignedEmployeeName: string;
  status: FollowUpStatus;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface FollowUpInput {
  title: string;
  followUpType: FollowUpType;
  scheduledAt: string;
  assignedEmployeeId?: string;
  notes?: string;
}

export type PtpStatus = "PENDING" | "KEPT" | "BROKEN" | "CANCELLED";

export interface CustomerPromiseToPayItem {
  id: string;
  customerId: string;
  customerName: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  promisedAmount: number;
  promisedDate: string;
  status: PtpStatus;
  notes?: string;
  recordedByName: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface PtpInput {
  salesOrderId?: string;
  promisedAmount: number;
  promisedDate: string;
  notes?: string;
}

export interface StoreCreditEntryItem {
  id: string;
  customerId: string;
  entryType: "GRANT" | "REDEEM" | "EXPIRE" | "ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface StoreCreditInput {
  amount: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface StoreVoucherItem {
  id: string;
  code: string;
  title: string;
  voucherType: "FIXED_AMOUNT" | "PERCENTAGE";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  timesUsed: number;
  active: boolean;
  assignedCustomerId?: string;
  assignedCustomerName?: string;
  notes?: string;
}

export interface DuplicateMatchResultItem {
  matchedCustomerId: string;
  matchedCustomerName: string;
  matchedNik?: string;
  matchedPhone?: string;
  matchScorePercent: number;
  matchReasons: string[];
}

export interface DuplicateCheckInput {
  currentCustomerId?: string;
  fullName?: string;
  phone?: string;
  nik?: string;
  motherMaidenName?: string;
}
