export type DeliveryTripStatus =
  | "PLANNED"
  | "DISPATCHED"
  | "COMPLETED"
  | "CANCELLED";

export type DeliveryOrderStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type DeliveryItemStatus = "PENDING" | "DELIVERED" | "REJECTED";

export interface DeliveryTrip {
  id: string;
  tripNumber: string;
  storeId: string;
  storeName: string | null;
  driverEmployeeId: string;
  driverName: string | null;
  helperEmployeeId: string | null;
  helperName: string | null;
  vehiclePlate: string | null;
  scheduledDate: string;
  status: DeliveryTripStatus;
  departedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateDeliveryTripInput {
  storeId: string;
  driverEmployeeId: string;
  helperEmployeeId?: string;
  vehiclePlate?: string;
  scheduledDate?: string;
  notes?: string;
}

export interface DeliveryItem {
  id: string;
  soItemStockUnitId: string;
  stockUnitId: string | null;
  manufacturerSerial: string | null;
  productName: string | null;
  variantName: string | null;
  sku: string | null;
  status: DeliveryItemStatus;
  rejectionReason: string | null;
  notes: string | null;
}

export interface DeliveryOrder {
  id: string;
  deliveryOrderNumber: string | null;
  salesOrderId: string;
  salesOrderNumber: string | null;
  deliveryTripId: string | null;
  tripNumber: string | null;
  destinationAddress: string;
  recipientName: string | null;
  recipientPhone: string | null;
  stopSequence: number;
  status: DeliveryOrderStatus;
  preInspectionPassed: boolean;
  preInspectionNotes: string | null;
  deliveredAt: string | null;
  signedBy: string | null;
  proofPhotoUrl: string | null;
  failureReason: string | null;
  codAmount: number;
  codCollected: number;
  codNotes: string | null;
  notes: string | null;
  createdAt: string;
  items: DeliveryItem[];
}

export interface CreateDeliveryOrderInput {
  salesOrderId: string;
  deliveryTripId?: string;
  destinationAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
  stopSequence?: number;
  codAmount?: number;
  notes?: string;
  soItemStockUnitIds: string[];
}

export interface PreInspectionInput {
  passed: boolean;
  notes?: string;
}

export interface CompleteDeliveryOrderInput {
  signedBy?: string;
  proofPhotoUrl?: string;
  codCollected?: number;
  codNotes?: string;
  notes?: string;
}

export interface FailDeliveryOrderInput {
  failureReason: string;
  notes?: string;
}
