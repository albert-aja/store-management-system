export interface ExecutiveOverview {
  totalSalesAmount: number;
  totalOrdersCount: number;
  totalCashCollected: number;
  totalOutstandingReceivables: number;
  overdueReceivablesAmount: number;
  activeCreditAccountsCount: number;
  totalStockUnitsCount: number;
  warehouseUnitsCount: number;
  showroomUnitsCount: number;
  repairUnitsCount: number;
  totalExpensesAmount: number;
  totalOverrunExpensesCount: number;
}

export interface SalesPerformanceItem {
  salespersonId: string;
  salespersonName: string;
  salespersonCode?: string;
  confirmedOrdersCount: number;
  totalSalesVolume: number;
  estimatedCommission: number;
}

export interface CollectionAgingBucket {
  bucketName: string;
  installmentCount: number;
  totalAmount: number;
  percentage: number;
}

export interface CollectionAgingSummary {
  buckets: CollectionAgingBucket[];
  totalReceivableBalance: number;
  totalOverdueBalance: number;
  totalCollectedCash: number;
  custodyDiscrepanciesCount: number;
}

export interface InventoryDistribution {
  totalUnits: number;
  warehouseUnits: number;
  showroomUnits: number;
  repairAreaUnits: number;
  inTransitUnits: number;
  atCustomerUnits: number;
  availableUnits: number;
  reservedUnits: number;
  unavailableUnits: number;
}

export interface OperationalExceptionItem {
  exceptionType: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  referenceCode: string;
  details: string;
  actionUrl: string;
}
