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

// ── Comparative Analytics Types ─────────────────────────────────────────────

export interface PeriodMetric {
  periodLabel: string;
  startDate: string;
  endDate: string;
  grossSales: number;
  confirmedOrders: number;
  cashCollected: number;
  paymentsCount: number;
  averageOrderValue: number;
}

export interface PeriodDelta {
  salesDifference: number;
  salesGrowthPercentage: number;
  collectionDifference: number;
  collectionGrowthPercentage: number;
  ordersDifference: number;
  ordersGrowthPercentage: number;
}

export interface DailyTrendItem {
  day: string;
  dayIndex: number;
  primarySales: number;
  comparisonSales: number;
  primaryCollections: number;
  comparisonCollections: number;
}

export interface PeriodComparisonResponse {
  primary: PeriodMetric;
  comparison: PeriodMetric;
  delta: PeriodDelta;
  dailyTrends: DailyTrendItem[];
  primaryAging: CollectionAgingBucket[];
  comparisonAging: CollectionAgingBucket[];
}


// ── Scheduled Reports Types (Task G.9) ───────────────────────────────────────

export type ScheduledReportType = 'FINANCIAL_AGING' | 'STOCK_BALANCE' | 'ALL_COMBINED';
export type ScheduleFrequency = 'DAILY' | 'WEEKLY';
export type ScheduledExecutionStatus = 'SUCCESS' | 'FAILED' | 'RUNNING';

export interface ScheduledReportConfig {
  id: string;
  name: string;
  reportType: ScheduledReportType;
  frequency: ScheduleFrequency;
  dayOfWeek?: string | null;
  dispatchTime: string;
  storeId?: string | null;
  storeName?: string | null;
  targetRole: string;
  customRecipientEmails?: string | null;
  enabled: boolean;
  lastRunAt?: string | null;
  lastStatus?: ScheduledExecutionStatus | null;
  lastErrorMessage?: string | null;
  createdAt?: string;
}

export interface ScheduledReportLog {
  id: string;
  configId?: string | null;
  configName: string;
  executedAt: string;
  reportType: ScheduledReportType;
  status: ScheduledExecutionStatus;
  recipientsCount: number;
  recipientEmails?: string | null;
  attachmentsGenerated?: string | null;
  durationMs: number;
  errorMessage?: string | null;
}

export interface RecipientPreview {
  count: number;
  storeId?: string | null;
  storeName: string;
  targetRole: string;
  emails: string[];
  managerNames: string[];
}

export interface TriggerDispatchResult {
  success: boolean;
  message: string;
  logId: string;
  recipientsDispatched: number;
  recipientEmails: string[];
  attachments: string[];
  durationMs: number;
}
