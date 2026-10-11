export type StockReturnType = 'CUSTOMER_RETURN' | 'REPOSSESSION';

export type StockReturnStatus = 'SCHEDULED' | 'RECEIVED' | 'CANCELLED';

export type ReturnDisposition = 'SELL_AS_IS' | 'REPAIR_THEN_SELL' | 'SCRAP_DISPOSAL';

export type WarrantyCoverageDecision = 'PENDING' | 'COVERED_REPAIR' | 'COVERED_REPLACE' | 'REJECTED';

export type WarrantyClaimStatus = 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'RESOLVED' | 'REJECTED';

export type RepairStatus = 'IN_HOUSE_PENDING' | 'SENT_TO_VENDOR' | 'REPAIRED' | 'UNREPAIRABLE' | 'CANCELLED';

export interface StockReturnDisposition {
  id: string;
  disposition: ReturnDisposition;
  inspectedById?: string;
  inspectedByName?: string;
  inspectedAt: string;
  conditionNotes?: string;
  requiresRepair: boolean;
  requiresDisposal: boolean;
}

export interface StockReturn {
  id: string;
  returnNumber: string;
  storeId: string;
  storeName: string;
  customerId?: string;
  customerName?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  stockUnitId?: string;
  manufacturerSerial?: string;
  productVariantName?: string;
  receivableId?: string;
  receivableNumber?: string;
  returnType: StockReturnType;
  status: StockReturnStatus;
  driverId?: string;
  driverName?: string;
  helperId?: string;
  helperName?: string;
  vehiclePlate?: string;
  scheduledDate?: string;
  recoveredAt?: string;
  customerRefusalReason?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  disposition?: StockReturnDisposition;
}

export interface CreateStockReturnPayload {
  storeId: string;
  customerId?: string;
  salesOrderId?: string;
  stockUnitId: string;
  receivableId?: string;
  returnType: StockReturnType;
  driverId?: string;
  helperId?: string;
  vehiclePlate?: string;
  scheduledDate?: string;
  reason?: string;
  notes?: string;
}

export interface CompleteReturnPayload {
  recovered: boolean;
  refusalReason?: string;
  notes?: string;
}

export interface RecordDispositionPayload {
  disposition: ReturnDisposition;
  inspectedById: string;
  conditionNotes?: string;
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  storeId: string;
  storeName: string;
  customerId?: string;
  customerName?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  stockUnitId?: string;
  manufacturerSerial?: string;
  productVariantName?: string;
  replacementStockUnitId?: string;
  replacementManufacturerSerial?: string;
  distributorName?: string;
  defectDescription?: string;
  distributorClaimRef?: string;
  coverageDecision: WarrantyCoverageDecision;
  status: WarrantyClaimStatus;
  decisionNotes?: string;
  resolutionDate?: string;
  createdAt: string;
}

export interface CreateWarrantyClaimPayload {
  storeId: string;
  customerId?: string;
  salesOrderId?: string;
  stockUnitId: string;
  distributorName?: string;
  defectDescription: string;
  distributorClaimRef?: string;
}

export interface DecideWarrantyClaimPayload {
  decision: WarrantyCoverageDecision;
  replacementStockUnitId?: string;
  decisionNotes?: string;
}

export interface RepairTicket {
  id: string;
  ticketNumber: string;
  storeId: string;
  storeName: string;
  stockUnitId: string;
  manufacturerSerial?: string;
  productVariantName?: string;
  warrantyClaimId?: string;
  stockReturnId?: string;
  vendorName: string;
  problemDescription?: string;
  diagnosis?: string;
  actionTaken?: string;
  repairCost?: number;
  status: RepairStatus;
  sentAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateRepairTicketPayload {
  storeId: string;
  stockUnitId: string;
  warrantyClaimId?: string;
  stockReturnId?: string;
  vendorName: string;
  problemDescription: string;
  estimatedCost?: number;
}

export interface CompleteRepairTicketPayload {
  status: RepairStatus;
  diagnosis?: string;
  actionTaken?: string;
  repairCost?: number;
  notes?: string;
}

export interface StockDisposal {
  id: string;
  disposalNumber: string;
  storeId: string;
  storeName: string;
  stockUnitId: string;
  manufacturerSerial?: string;
  productVariantName?: string;
  reason: string;
  buyerName?: string;
  scrapProceeds: number;
  authorizedById: string;
  authorizedByName: string;
  disposedAt: string;
  notes?: string;
  createdAt: string;
}

export interface CreateStockDisposalPayload {
  storeId: string;
  stockUnitId: string;
  reason: string;
  buyerName?: string;
  scrapProceeds?: number;
  authorizedById: string;
  notes?: string;
}
