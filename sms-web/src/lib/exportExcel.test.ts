import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportFinancialAgingToExcel,
  exportMultiSheetExcel,
  exportStockBalanceToExcel,
  exportToExcel,
} from "./exportExcel";

describe("exportExcel utility", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let clickMock: ReturnType<typeof vi.fn>;
  let createdLink: HTMLAnchorElement;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => "blob:http://localhost/mock-excel-blob");
    revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock as unknown as (obj: Blob | MediaSource) => string;
    window.URL.revokeObjectURL = revokeObjectURLMock as unknown as (url: string) => void;

    clickMock = vi.fn();
    createdLink = {
      setAttribute: vi.fn(),
      click: clickMock,
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return createdLink;
      return document.createElement(tag);
    });

    vi.spyOn(document.body, "appendChild").mockImplementation(() => null as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => null as unknown as Node);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("exports single-sheet Excel workbook and triggers download", () => {
    exportToExcel({
      filename: "test_inventory",
      sheetName: "Inventory",
      columns: [
        { key: "sku", label: "SKU Code" },
        { key: "name", label: "Product Name" },
        { key: "price", label: "Price", format: (v) => Number(v) },
      ],
      data: [
        { sku: "ELEC-001", name: "LG Refrigerator 2-Door", price: 4500000 },
        { sku: "FURN-002", name: "Modern Sofa 3-Seater", price: 3200000 },
      ],
      title: "Store Inventory Report",
      subtitle: "Active stock items",
      metadata: { "Store": "Jakarta Barat", "Generated": "2026-10-30" },
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(createdLink.setAttribute).toHaveBeenCalledWith("download", "test_inventory.xlsx");
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it("alerts when single-sheet data is empty", () => {
    exportToExcel({
      filename: "empty_export",
      columns: [{ key: "a", label: "Col A" }],
      data: [],
    });

    expect(window.alert).toHaveBeenCalledWith("No data available to export.");
    expect(clickMock).not.toHaveBeenCalled();
  });

  it("exports multi-sheet Excel workbook with custom sheet tabs", () => {
    exportMultiSheetExcel({
      filename: "multi_sheet_report",
      sheets: [
        {
          sheetName: "Sheet Alpha",
          columns: [{ key: "id", label: "ID" }, { key: "title", label: "Title" }],
          data: [{ id: 1, title: "Item 1" }],
        },
        {
          sheetName: "Sheet Beta",
          columns: [{ key: "metric", label: "Metric" }, { key: "val", label: "Value" }],
          data: [{ metric: "Revenue", val: 1000000 }],
        },
      ],
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(createdLink.setAttribute).toHaveBeenCalledWith("download", "multi_sheet_report.xlsx");
    expect(clickMock).toHaveBeenCalled();
  });

  it("exports financial aging multi-sheet workbook with buckets and receivable accounts", () => {
    exportFinancialAgingToExcel({
      storeName: "Surabaya Center",
      asOfDate: "2026-10-30",
      summary: {
        totalReceivableBalance: 150000000,
        totalOverdueBalance: 25000000,
        totalCollectedCash: 45000000,
        custodyDiscrepanciesCount: 0,
      },
      buckets: [
        { bucketName: "Current (0-30 Days)", installmentCount: 42, totalAmount: 125000000, percentage: 83.3 },
        { bucketName: "Past Due (1-30 Days)", installmentCount: 6, totalAmount: 15000000, percentage: 10.0 },
        { bucketName: "Delinquent (31-60 Days)", installmentCount: 3, totalAmount: 7000000, percentage: 4.7 },
        { bucketName: "Default Risk (> 60 Days)", installmentCount: 1, totalAmount: 3000000, percentage: 2.0 },
      ],
      receivables: [
        {
          receivableNumber: "REC-2026-001",
          customerName: "Budi Santoso",
          customerPhone: "081234567890",
          storeName: "Surabaya Center",
          financedAmount: 12000000,
          totalPaid: 4000000,
          remainingBalance: 8000000,
          paymentTermMonths: 12,
          status: "ACTIVE",
          firstDueDate: "2026-05-10",
        },
      ],
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(createdLink.setAttribute).toHaveBeenCalledWith(
      "download",
      "financial_aging_report_20261030.xlsx",
    );
    expect(clickMock).toHaveBeenCalled();
  });

  it("exports stock balance multi-sheet workbook with inventory distribution and unit ledger", () => {
    exportStockBalanceToExcel({
      storeName: "Bandung Branch",
      asOfDate: "2026-10-30",
      stockUnits: [
        {
          manufacturerSerial: "SN-99881122",
          variantName: "Smart TV 55 Inch UHD",
          locationType: "SHOWROOM",
          availabilityStatus: "AVAILABLE",
          notes: "Display model near entrance",
        },
        {
          manufacturerSerial: null,
          variantName: "Office Chair Ergonomic",
          locationType: "WAREHOUSE",
          availabilityStatus: "RESERVED",
          notes: "Allocated to SO-0044",
        },
      ],
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(createdLink.setAttribute).toHaveBeenCalledWith(
      "download",
      "stock_balance_report_20261030.xlsx",
    );
    expect(clickMock).toHaveBeenCalled();
  });
});
