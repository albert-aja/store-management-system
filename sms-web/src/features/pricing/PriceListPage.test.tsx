import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PriceListPage from "./PriceListPage";

// Mock stores
vi.mock("../stores/hooks", () => ({
  useStores: () => ({
    data: [
      { id: "store-1", name: "Pusat Jaya Store" },
      { id: "store-2", name: "Cabang Timur Store" },
    ],
  }),
}));

const mockPriceListReport = {
  storeId: "store-1",
  storeName: "Pusat Jaya Store",
  effectiveDate: "2026-10-31",
  groups: [
    {
      groupName: "LEMARI PAKAIAN",
      items: [
        {
          variantId: "v1",
          sku: "LP2P01",
          productName: "Lemari Pakaian 2 Pintu Bet AI",
          variantName: "Standard",
          displayName: "Lemari Pakaian 2 Pintu Bet AI",
          categoryName: "Lemari Pakaian",
          brandName: "Olympic",
          specifications: "Kayu MDF",
          cashPrice: 2878000,
          hargaDasar: 2878000,
          downPayment: 0,
          installment10: 350000,
          installment12: 310000,
          installment15: 270000,
        },
        {
          variantId: "v2",
          sku: "LP4P01",
          productName: "Lemari Pakaian 4 Pintu Bet AI",
          variantName: "Standard",
          displayName: "Lemari Pakaian 4 Pintu Bet AI",
          categoryName: "Lemari Pakaian",
          brandName: "Olympic",
          specifications: "4 Pintu Kaca",
          cashPrice: 5068000,
          hargaDasar: 5068000,
          downPayment: 1000000,
          installment10: 495000,
          installment12: 435000,
          installment15: 375000,
        },
      ],
    },
    {
      groupName: "MESIN CUCI",
      items: [
        {
          variantId: "v3",
          sku: "MC-78P",
          productName: "Midea 78-P1301Q",
          variantName: "6.5 KG",
          displayName: "Midea 78-P1301Q (6.5 KG)",
          categoryName: "Mesin Cuci",
          brandName: "Midea",
          specifications: "2 Tabung",
          cashPrice: 2288000,
          hargaDasar: 2288000,
          downPayment: 0,
          installment10: 280000,
          installment12: 250000,
          installment15: 215000,
        },
      ],
    },
  ],
};

const mockPriceListVersions = [
  {
    id: "ver-1",
    storeId: "store-1",
    storeName: "Pusat Jaya Store",
    versionCode: "PL-20261031-001",
    title: "Daftar Harga Pusat Jaya Store (Berlaku 31 Oktober 2026)",
    validFrom: "2026-10-31",
    groupBy: "category",
    fileName: "Daftar_Harga_Pusat_Jaya_Store_category_PL-20261031-001.html",
    mimeType: "text/html",
    fileSizeBytes: 24500,
    itemCount: 3,
    notes: "Katalog Reguler Akhir Bulan",
    createdAt: "2026-10-31T10:00:00Z",
    viewUrl: "/api/stores/store-1/pricing/price-list/versions/ver-1/view",
    downloadUrl: "/api/stores/store-1/pricing/price-list/versions/ver-1/download",
  },
];

const mockGenerateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock("./hooks", () => ({
  usePriceList: () => ({
    data: mockPriceListReport,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePriceListVersions: () => ({
    data: mockPriceListVersions,
    isLoading: false,
  }),
  useLatestPriceListVersion: () => ({
    data: mockPriceListVersions[0],
    isLoading: false,
  }),
  useGenerateAndStorePriceListVersion: () => ({
    mutate: mockGenerateMutate,
    isPending: false,
  }),
  useDeletePriceListVersion: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
  useAutoApplyAllPricing: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("PriceListPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    window.open = vi.fn();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <PriceListPage />
      </QueryClientProvider>
    );

  it("renders page header and action buttons", () => {
    renderComponent();

    expect(
      screen.getByText("Price List & Installment Plans")
    ).toBeInTheDocument();
    expect(screen.getByText("Generate & Save to Server")).toBeInTheDocument();
    expect(screen.getByText("Download Saved Version")).toBeInTheDocument();
    expect(screen.getByText("Print PDF")).toBeInTheDocument();
    expect(screen.getByText("Export Excel (.xlsx)")).toBeInTheDocument();
    expect(screen.getByText("Auto-Calculate All")).toBeInTheDocument();
  });

  it("renders grouped category tables, formula installment values, and validFrom footer", () => {
    renderComponent();

    expect(screen.getByText("LEMARI PAKAIAN")).toBeInTheDocument();
    expect(screen.getByText("MESIN CUCI")).toBeInTheDocument();

    // Check items
    expect(
      screen.getByText("Lemari Pakaian 2 Pintu Bet AI")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Lemari Pakaian 4 Pintu Bet AI")
    ).toBeInTheDocument();

    // Verify installments (in thousands, e.g. 350, 310, 270)
    expect(screen.getByText("350")).toBeInTheDocument();
    expect(screen.getByText("310")).toBeInTheDocument();
    expect(screen.getByText("270")).toBeInTheDocument();

    // Verify item with DP
    expect(screen.getByText("495")).toBeInTheDocument();
    expect(screen.getByText("435")).toBeInTheDocument();
    expect(screen.getByText("375")).toBeInTheDocument();

    // Verify section footer with the localized effective-date label
    const footers = screen.getAllByText(/Effective date/i);
    expect(footers.length).toBeGreaterThan(0);
  });

  it("filters items when search input changes", () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText("Search brand, model, type...");
    fireEvent.change(searchInput, { target: { value: "Midea" } });

    expect(screen.getByText("Midea 78-P1301Q (6.5 KG)")).toBeInTheDocument();
    expect(
      screen.queryByText("Lemari Pakaian 2 Pintu Bet AI")
    ).not.toBeInTheDocument();
  });

  it("opens generate version dialog when Generate & Simpan ke Server clicked", () => {
    renderComponent();

    const generateBtn = screen.getByText("Generate & Save to Server");
    fireEvent.click(generateBtn);

    expect(
      screen.getByText("Generate & Save Document to Server")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Save & Download Automatically")
    ).toBeInTheDocument();
  });

  it("switches to Document Versioning tab and shows stored versions list", () => {
    renderComponent();

    const versioningTab = screen.getByText(/Document Version History/i);
    fireEvent.click(versioningTab);

    expect(screen.getByText("Saved Document Versions (Document Archive)")).toBeInTheDocument();
    expect(screen.getByText("PL-20261031-001")).toBeInTheDocument();
    expect(screen.getByText("Katalog Reguler Akhir Bulan")).toBeInTheDocument();
    expect(screen.getByText("Generate New Version")).toBeInTheDocument();
  });

  it("triggers printable window.open when Cetak PDF is clicked", () => {
    renderComponent();

    const printButton = screen.getByText("Print PDF");
    fireEvent.click(printButton);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("/api/documents/print/price-list"),
      "_blank"
    );
  });
});
