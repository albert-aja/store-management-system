import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CustomerDetailPage from "./CustomerDetailPage";

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "cust-1" }),
}));

vi.mock("../../store/authStore", () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      employee: {
        id: "emp-1",
        roleCodes: ["OWNER", "MANAGER"],
        permissionCodes: ["CUSTOMER_MANAGE"],
        storeIds: [],
        fullName: "Admin",
      },
      hasRole: () => true,
      hasPermission: () => true,
    }),
  ),
}));

vi.mock("../documents/DocumentsPanel", () => ({
  default: () => <div>Documents Panel Mock</div>,
}));

vi.mock("./hooks", () => ({
  useCustomer: vi.fn(() => ({
    data: {
      id: "cust-1",
      fullName: "Budi Santoso",
      nik: "3171012345678901",
      primaryPhone: "081234567890",
      primaryEmail: "budi@example.com",
      motherMaidenName: "Siti Rahma",
      birthDate: "1990-05-15",
      birthPlace: "Jakarta",
      segment: "STAR_CREDIT",
      creditScoreGrade: "A",
      creditScorePoints: 95,
      clvAmount: 25000000,
      totalOrdersCount: 4,
    },
  })),
  useCustomer360: vi.fn(() => ({
    data: {
      customerId: "cust-1",
      fullName: "Budi Santoso",
      nik: "3171012345678901",
      primaryPhone: "081234567890",
      primaryEmail: "budi@example.com",
      motherMaidenName: "Siti Rahma",
      birthDate: "1990-05-15",
      birthPlace: "Jakarta",
      segment: "STAR_CREDIT",
      creditScoreGrade: "A",
      creditScorePoints: 95,
      clvAmount: 25000000,
      totalOrdersCount: 4,
      storeCreditBalance: 350000,
      activeVouchersCount: 2,
      pendingPtpCount: 1,
      pendingFollowUpsCount: 1,
      tags: [
        { id: "tag-1", tagName: "STAR_CREDIT", color: "#8b5cf6" },
        { id: "tag-2", tagName: "VIP_CUSTOMER", color: "#10b981" },
      ],
      timeline: [
        {
          id: "evt-1",
          eventType: "SALES_ORDER",
          title: "Pesanan Penjualan #SO-202610-001",
          description: "Total: Rp 8.500.000 • Status: CONFIRMED",
          status: "CONFIRMED",
          timestamp: new Date().toISOString(),
          badgeColor: "#2563eb",
        },
        {
          id: "evt-2",
          eventType: "PTP",
          title: "Janji Bayar (PTP) - 2026-11-05",
          description: "Nominal Dijanjikan: Rp 750.000 • Status: PENDING",
          status: "PENDING",
          timestamp: new Date().toISOString(),
          badgeColor: "#ec4899",
        },
      ],
    },
    refetch: vi.fn(),
  })),
  useCustomerContacts: vi.fn(() => ({
    data: [
      { id: "c-1", contactType: "PHONE", label: "Mobile", value: "081234567890", active: true },
    ],
  })),
  useCustomerAddresses: vi.fn(() => ({
    data: [
      { id: "a-1", label: "Rumah", addressLine: "Jl. Sudirman No. 10, Jakarta", primary: true, active: true },
    ],
  })),
  useCustomerInteractions: vi.fn(() => ({
    data: [
      {
        id: "int-1",
        customerId: "cust-1",
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        summary: "Konfirmasi jadwal pengiriman kulkas",
        outcome: "POSITIVE",
        recordedByName: "Agus Staff",
        createdAt: new Date().toISOString(),
      },
    ],
  })),
  useCustomerFollowUps: vi.fn(() => ({
    data: [
      {
        id: "fu-1",
        customerId: "cust-1",
        customerName: "Budi Santoso",
        title: "Telepon penawaran mesin cuci promo",
        followUpType: "SALES_LEAD",
        scheduledAt: new Date().toISOString(),
        assignedEmployeeName: "Agus Staff",
        status: "SCHEDULED",
        createdAt: new Date().toISOString(),
      },
    ],
  })),
  useCustomerPtps: vi.fn(() => ({
    data: [
      {
        id: "ptp-1",
        customerId: "cust-1",
        customerName: "Budi Santoso",
        promisedAmount: 750000,
        promisedDate: "2026-11-05",
        status: "PENDING",
        notes: "Akan bayar via transfer",
        recordedByName: "Agus Collector",
        createdAt: new Date().toISOString(),
      },
    ],
  })),
  useCustomerStoreCredit: vi.fn(() => ({
    data: [
      {
        id: "sc-1",
        customerId: "cust-1",
        entryType: "GRANT",
        amount: 350000,
        balanceAfter: 350000,
        notes: "Uang muka titipan",
        createdAt: new Date().toISOString(),
      },
    ],
  })),
  useCustomerVouchers: vi.fn(() => ({
    data: [
      {
        id: "v-1",
        code: "DISC50K",
        title: "Diskon Belanja Rp 50.000",
        voucherType: "FIXED_AMOUNT",
        discountValue: 50000,
        validFrom: "2026-10-01",
        validUntil: "2026-12-31",
        maxUses: 1,
        timesUsed: 0,
        active: true,
      },
    ],
  })),
  useAddAddress: vi.fn(() => ({ mutate: vi.fn() })),
  useAddContact: vi.fn(() => ({ mutate: vi.fn() })),
  useAddCustomerTag: vi.fn(() => ({ mutate: vi.fn() })),
  useCancelCustomerFollowUp: vi.fn(() => ({ mutate: vi.fn() })),
  useCompleteCustomerFollowUp: vi.fn(() => ({ mutate: vi.fn() })),
  useCreateCustomerFollowUp: vi.fn(() => ({ mutate: vi.fn() })),
  useDeactivateAddress: vi.fn(() => ({ mutate: vi.fn() })),
  useDeactivateContact: vi.fn(() => ({ mutate: vi.fn() })),
  useGrantCustomerStoreCredit: vi.fn(() => ({ mutate: vi.fn() })),
  useLogCustomerInteraction: vi.fn(() => ({ mutate: vi.fn() })),
  useRecordCustomerPtp: vi.fn(() => ({ mutate: vi.fn() })),
  useRedeemCustomerStoreCredit: vi.fn(() => ({ mutate: vi.fn() })),
  useRemoveCustomerTag: vi.fn(() => ({ mutate: vi.fn() })),
  useSetPrimaryAddress: vi.fn(() => ({ mutate: vi.fn() })),
  useUpdateCustomerPtpStatus: vi.fn(() => ({ mutate: vi.fn() })),
}));

describe("CustomerDetailPage (Customer 360 & CRM)", () => {
  it("renders 360 header profile, demographic tags, and key metrics", async () => {
    render(<CustomerDetailPage />);

    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText(/Star Credit Customer/i)).toBeInTheDocument();
    expect(screen.getByText(/Credit Score: A \(95\/100\)/i)).toBeInTheDocument();
    expect(screen.getByText("STAR_CREDIT")).toBeInTheDocument();
    expect(screen.getByText("VIP_CUSTOMER")).toBeInTheDocument();

    // Check KPI Cards
    expect(screen.getByText(/CUSTOMER LIFETIME VALUE/i)).toBeInTheDocument();
    expect(screen.getByText(/SALDO STORE CREDIT/i)).toBeInTheDocument();
    expect(screen.getByText(/JANJI BAYAR \(PTP\) PENDING/i)).toBeInTheDocument();
    expect(screen.getByText(/PENGINGAT & TINDAK LANJUT/i)).toBeInTheDocument();

    // Check 360 timeline item
    expect(screen.getByText(/Pesanan Penjualan #SO-202610-001/i)).toBeInTheDocument();
  });

  it("switches tabs between Omnichannel, PTP, Follow-up, and Store Credit", async () => {
    const user = userEvent.setup();
    render(<CustomerDetailPage />);

    // Switch to Omnichannel tab
    const omnichannelTab = screen.getByRole("tab", { name: /Omnichannel Log/i });
    await user.click(omnichannelTab);
    expect(screen.getByText(/Log Komunikasi Omnichannel/i)).toBeInTheDocument();
    expect(screen.getByText(/Konfirmasi jadwal pengiriman kulkas/i)).toBeInTheDocument();

    // Switch to PTP tab
    const ptpTab = screen.getByRole("tab", { name: /Janji Bayar/i });
    await user.click(ptpTab);
    expect(screen.getByText(/Daftar Janji Bayar \(Promise-to-Pay \/ PTP\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Rp 750\.000/i)).toBeInTheDocument();

    // Switch to Follow-Up tab
    const followUpTab = screen.getByRole("tab", { name: /Pengingat/i });
    await user.click(followUpTab);
    expect(screen.getByText(/Jadwal Pengingat & Tindak Lanjut/i)).toBeInTheDocument();
    expect(screen.getByText(/Telepon penawaran mesin cuci promo/i)).toBeInTheDocument();

    // Switch to Store Credit tab
    const storeCreditTab = screen.getByRole("tab", { name: /Store Credit/i });
    await user.click(storeCreditTab);
    expect(screen.getByText(/Store Credit Ledger & Kupon Promo/i)).toBeInTheDocument();
    expect(screen.getByText(/DISC50K/i)).toBeInTheDocument();
  });
});
