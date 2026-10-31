import { describe, expect, it, vi } from "vitest";
import { convertDocxToHtml } from "./docxParser";
import mammoth from "mammoth";

vi.mock("mammoth", () => ({
  default: {
    convertToHtml: vi.fn(),
  },
}));

describe("docxParser", () => {
  it("converts docx ArrayBuffer to HTML successfully", async () => {
    vi.mocked(mammoth.convertToHtml).mockResolvedValueOnce({
      value: "<h1>Document Title</h1><p>Test paragraph content</p>",
      messages: [],
    });

    const buffer = new ArrayBuffer(8);
    const result = await convertDocxToHtml(buffer);

    expect(result.isSuccess).toBe(true);
    expect(result.html).toContain("Document Title");
    expect(result.html).toContain("Test paragraph content");
  });

  it("handles empty document gracefully", async () => {
    vi.mocked(mammoth.convertToHtml).mockResolvedValueOnce({
      value: "",
      messages: [],
    });

    const buffer = new ArrayBuffer(4);
    const result = await convertDocxToHtml(buffer);

    expect(result.isSuccess).toBe(true);
    expect(result.html).toContain("(Empty document)");
  });

  it("handles parse error gracefully", async () => {
    vi.mocked(mammoth.convertToHtml).mockRejectedValueOnce(
      new Error("Corrupt docx zip header"),
    );

    const buffer = new ArrayBuffer(4);
    const result = await convertDocxToHtml(buffer);

    expect(result.isSuccess).toBe(false);
    expect(result.error).toContain("Corrupt docx zip header");
    expect(result.html).toBe("");
  });
});
