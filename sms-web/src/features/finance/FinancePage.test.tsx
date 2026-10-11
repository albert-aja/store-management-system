import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FinancePage from "./FinancePage";

vi.mock("notistack", () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
}));

vi.mock("../../store/authStore", () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      employee: {
        id: "emp-1",
        roleCodes: ["OWNER", "MANAGER"],
        permissionCodes: ["FINANCE_MANAGE"],
        storeIds: [],
        fullName: "Admin",
      },
      hasRole: () => true,
      hasPermission: () => true,
    }),
  ),
}));

vi.mock("../stores/hooks", () => ({
  useStores: vi.fn(() => ({
    data: [
      { id: "store-1", name: "Main Store", code: "ST01" },
    ],
  })),
}));

vi.mock("../customers/hooks", () => ({
  useCustomers: vi.fn(() => ({
    data: [
      { id: "cust-1", fullName: "Budi Santoso", nik: "3201234567890001" },
    ],
  })),
}));

vi.mock("../employees/hooks", () => ({
  useEmployees: vi.fn(() => ({
    data: [
      { id: "emp-1", fullName: "Agus Collector", employmentStatus: "ACTIVE", roleCodes: ["COLLECTOR"] },
    ],
  })),
}));

vi.mock("./hooks", () => ({
  useReceivables: vi.fn(() => ({
    data: [
      {
        id: "rec-1",
        receivableNumber: "REC-202610-0001",
        storeId: "store-1",
        storeName: "Main Store",
        customerId: "cust-1",
        customerName: "Budi Santoso",
        salesOrderId: "so-1",
        salesOrderNumber: "SO-202610-0001",
        salesOrderItemId: null,
        totalAmount: 10000000,
        downPaymentAmount: 1000000,
        financedAmount: 9000000,
        totalPaid: 3000000,
        remainingBalance: 6000000,
        paymentTermMonths: 10,
        status: "ACTIVE",
        firstDueDate: "2026-11-01",
        createdAt: "2026-10-08T10:00:00Z",
        installments: [
          {
            id: "inst-1",
            receivableId: "rec-1",
            installmentNumber: 1,
            dueDate: "2026-11-01",
            amountDue: 900000,
            amountPaid: 900000,
            status: "PAID",
            paidAt: "2026-11-01T10:00:00Z",
            notes: null,
            daysOverdue: 0,
          },
        ],
      },
    ],
    isLoading: false,
  })),
  useCustomerPayments: vi.fn(() => ({
    data: [
      {
        id: "pay-1",
        paymentNumber: "PAY-202610-0001",
        storeId: "store-1",
        storeName: "Main Store",
        customerId: "cust-1",
        customerName: "Budi Santoso",
        salesOrderId: "so-1",
        salesOrderNumber: "SO-202610-0001",
        amount: 900000,
        paymentType: "INSTALLMENT",
        paymentMethod: "CASH",
        referenceNumber: null,
        collectedById: "emp-1",
        collectedByName: "Agus Collector",
        paidAt: "2026-11-01T10:00:00Z",
        unallocatedAmount: 0,
        notes: null,
        allocations: [
          {
            id: "alloc-1",
            customerPaymentId: "pay-1",
            receivableInstallmentId: "inst-1",
            installmentNumber: 1,
            receivableNumber: "REC-202610-0001",
            amount: 900000,
            allocatedAt: "2026-11-01T10:00:00Z",
          },
        ],
      },
    ],
    isLoading: false,
  })),
  usePaymentCustodies: vi.fn(() => ({
    data: [
      {
        id: "custody-1",
        customerPaymentId: "pay-1",
        paymentNumber: "PAY-202610-0001",
        paymentAmount: 900000,
        holderEmployeeId: "emp-1",
        holderEmployeeName: "Agus Collector",
        handoverToEmployeeId: null,
        handoverToEmployeeName: null,
        status: "HELD_BY_COLLECTOR",
        expectedAmount: 900000,
        receivedAmount: null,
        discrepancyAmount: null,
        collectedAt: "2026-11-01T10:00:00Z",
        handedOverAt: null,
        verifiedAt: null,
        discrepancyNotes: null,
        notes: null,
      },
    ],
    isLoading: false,
  })),
  useCollectionAttempts: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useRecordCustomerPayment: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useHandoverCash: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useVerifyCash: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useRecordCollectionAttempt: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe("FinancePage", () => {
  it("renders page title and metric summaries", () => {
    render(<FinancePage />);

    expect(screen.getByText("Finance & Credit Management")).toBeInTheDocument();
    expect(screen.getByText("Total Financed Volume")).toBeInTheDocument();
    expect(screen.getByText("Total Cash Collected")).toBeInTheDocument();
    expect(screen.getByText("Outstanding Receivables")).toBeInTheDocument();
    expect(screen.getByText("Active Credit Accounts")).toBeInTheDocument();
  });

  it("displays credit accounts and opens schedule viewer modal", async () => {
    const user = userEvent.setup();
    render(<FinancePage />);

    expect(screen.getByText("REC-202610-0001")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();

    const scheduleBtn = screen.getByRole("button", { name: /Schedule/i });
    await user.click(scheduleBtn);

    expect(screen.getByText(/Credit Account: REC-202610-0001/i)).toBeInTheDocument();
    expect(screen.getByText(/Installment Schedule \(1 Months\)/i)).toBeInTheDocument();
  });

  it("switches tabs and displays payment ledger and cash custody", async () => {
    const user = userEvent.setup();
    render(<FinancePage />);

    // Click Payment Ledger tab
    const paymentsTab = screen.getByRole("tab", { name: /Payment Ledger/i });
    await user.click(paymentsTab);
    expect(screen.getByText("PAY-202610-0001")).toBeInTheDocument();

    // Click Cash Custody tab
    const custodyTab = screen.getByRole("tab", { name: /Cash Custody/i });
    await user.click(custodyTab);
    expect(screen.getByText("HELD_BY_COLLECTOR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hand Over/i })).toBeInTheDocument();
  });
});
