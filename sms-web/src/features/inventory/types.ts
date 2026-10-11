export type StockLocationType =
  | "WAREHOUSE"
  | "SHOWROOM"
  | "REPAIR_AREA"
  | "IN_TRANSIT"
  | "AT_CUSTOMER"
  | "AT_SUPPLIER"
  | "AT_REPAIR_PROVIDER"
  | "DISPOSED";
export type StockAvailability = "AVAILABLE" | "RESERVED" | "UNAVAILABLE";

export interface StockUnit {
  id: string;
  productVariantId: string;
  variantName: string;
  manufacturerSerial: string | null;
  currentStoreId: string;
  locationType: StockLocationType;
  availabilityStatus: StockAvailability;
  reservedForSoItemId: string | null;
  notes: string | null;
}

export interface ReceiveStockUnitInput {
  productVariantId: string;
  storeId: string;
  manufacturerSerial?: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  movementType: string;
  quantity: number;
  fromStoreId: string | null;
  toStoreId: string | null;
  fromLocationType: StockLocationType | null;
  toLocationType: StockLocationType | null;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  occurredAt: string;
}

export interface ComponentStock {
  id: string;
  storeId: string;
  productComponentId: string;
  componentName: string;
  quantityOnHand: number;
}

export interface Allocation {
  id: string;
  salesOrderItemId: string;
  stockUnitId: string;
  allocatedAt: string;
  releasedAt: string | null;
}
