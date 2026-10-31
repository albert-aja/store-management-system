import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PricingPanel from "./PricingPanel";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const theme = createTheme();

vi.mock("../../store/authStore", () => ({
  useAuthStore: (selector: any) =>
    selector({
      hasPermission: () => true,
    }),
}));

vi.mock("../stores/hooks", () => ({
  useStores: () => ({
    data: [
      { id: "store-1", name: "Central Showroom Jakarta" },
      { id: "store-2", name: "Surabaya Megastore" },
    ],
  }),
}));

vi.mock("./hooks", () => ({
  useStorePrices: () => ({
    data: [
      {
        id: "price-1",
        storeId: "store-1",
        productVariantId: "var-1",
        variantName: "Black 55 Inch",
        cashPrice: 7500000,
        active: true,
      },
    ],
  }),
  usePriceDiscounts: () => ({
    data: [
      {
        id: "disc-1",
        storeId: "store-1",
        storeName: "Central Showroom Jakarta",
        productId: "prod-1",
        productName: "Smart TV 55 Inch",
        productVariantId: "var-1",
        variantName: "Black 55 Inch",
        discountName: "Promo Weekend Elektronik 15%",
        discountType: "PERCENTAGE",
        discountValue: 15,
        minOrderAmount: 1000000,
        maxDiscountAmount: 1500000,
        minQuantity: 1,
        validFrom: "2026-10-01T00:00:00Z",
        validUntil: "2026-11-30T23:59:59Z",
        active: true,
        priority: 10,
        notes: "Syarat promo showroom",
        createdAt: "2026-10-31T00:00:00Z",
        updatedAt: "2026-10-31T00:00:00Z",
      },
    ],
  }),
  useUpsertPrice: () => ({ mutate: vi.fn() }),
  usePaymentPlans: () => ({ data: [] }),
  useUpsertPlan: () => ({ mutate: vi.fn() }),
  useToggleActiveDiscount: () => ({ mutate: vi.fn() }),
  useDeletePriceDiscount: () => ({ mutate: vi.fn() }),
  useCreatePriceDiscount: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdatePriceDiscount: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("PricingPanel (Store Prices & Promotional Discounts)", () => {
  const mockVariants = [
    {
      id: "var-1",
      sku: "SKU-TV-55-BLK",
      variantName: "Black 55 Inch",
      productId: "prod-1",
      active: true,
    },
  ];

  it("renders header and switches between Cash Pricing and Promotional Discounts tabs", async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <PricingPanel variants={mockVariants} productId="prod-1" />
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Initial render displays title and tabs
    expect(screen.getByText(/Store Pricing & Discount Management/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Cash Price & Installment Terms/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Store Promotional Discounts/i })).toBeInTheDocument();

    // Switch to Promotional Price Discounts tab
    await user.click(screen.getByRole("tab", { name: /Store Promotional Discounts/i }));

    // Displays promo campaign card
    expect(screen.getByText(/Promo Weekend Elektronik 15%/i)).toBeInTheDocument();
    expect(screen.getByText(/Discount 15%/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Promotion/i)).toBeInTheDocument();

    // Clicking "Buat Promo" opens dialog
    await user.click(screen.getByRole("button", { name: /Create Promotion/i }));
    expect(screen.getByText(/Create Promotional Discount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Promotion \/ Campaign Name/i)).toBeInTheDocument();
  });
});
