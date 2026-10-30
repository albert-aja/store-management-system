import { describe, expect, it, vi } from "vitest";
import { exportToCsv } from "./exportCsv";

describe("exportToCsv", () => {
  it("creates a blob and triggers download with CSV content", () => {
    const createObjectURLMock = vi.fn(() => "blob:http://localhost/test");
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

    exportToCsv(
      "test_report",
      [
        { key: "name", label: "Customer Name" },
        { key: "balance", label: "Balance" },
      ],
      [
        { name: "Budi Santoso", balance: 500000 },
        { name: "Dewi Lestari", balance: 250000 },
      ],
    );

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith("a");

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
