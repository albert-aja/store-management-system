import { describe, expect, it, vi } from "vitest";
import { exportDataGrid } from "./exportDataGrid";
import type { GridColDef } from "@mui/x-data-grid";

describe("exportDataGrid", () => {
  it("filters selected rows and exports properly", () => {
    const createObjectURLMock = vi.fn(() => "blob:http://localhost/test-grid");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const clickMock = vi.fn();
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
      setAttribute: vi.fn(),
      click: clickMock,
    } as unknown as HTMLAnchorElement);

    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => null as unknown as Node);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => null as unknown as Node);

    interface SampleRow {
      id: string;
      code: string;
      name: string;
      price: number;
    }

    const columns: GridColDef<SampleRow>[] = [
      { field: "code", headerName: "Item Code", width: 120 },
      { field: "name", headerName: "Item Name", width: 200 },
      {
        field: "price",
        headerName: "Price",
        valueGetter: (_, row) => `Rp ${row.price.toLocaleString("id-ID")}`,
      },
      { field: "actions", headerName: "", width: 100 }, // should be excluded
    ];

    const rows: SampleRow[] = [
      { id: "1", code: "TV-01", name: "Samsung TV 55", price: 7000000 },
      { id: "2", code: "FR-02", name: "LG Refrigerator", price: 8500000 },
      { id: "3", code: "AC-03", name: "Daikin AC 1PK", price: 4200000 },
    ];

    // 1. Test CSV with selected IDs
    exportDataGrid({
      filename: "test_inventory",
      title: "Test Inventory",
      columns,
      rows,
      selectedRowIds: ["1", "3"],
      format: "csv",
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();

    // 2. Test XLSX format
    exportDataGrid({
      filename: "test_inventory_excel",
      title: "Test Inventory Excel",
      columns,
      rows,
      selectedRowIds: ["2"],
      format: "xlsx",
    });

    expect(createObjectURLMock).toHaveBeenCalledTimes(2);

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
