import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import DocumentPreviewModal, {
  detectDocumentCategory,
} from "./DocumentPreviewModal";
import * as docxParser from "./docxParser";
import { documentsApi } from "./api";

vi.mock("./docxParser", () => ({
  convertDocxToHtml: vi.fn(),
}));

vi.mock("./api", () => ({
  documentsApi: {
    downloadDocument: vi.fn(),
    getDownloadTicket: vi.fn(),
  },
}));

describe("DocumentPreviewModal & detectDocumentCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-blob");
    window.URL.revokeObjectURL = vi.fn();
  });

  describe("detectDocumentCategory", () => {
    it("detects PDF files correctly", () => {
      expect(detectDocumentCategory("contract.pdf", "application/pdf")).toBe("pdf");
      expect(detectDocumentCategory("invoice.PDF", null)).toBe("pdf");
    });

    it("detects image files correctly", () => {
      expect(detectDocumentCategory("photo.png", "image/png")).toBe("image");
      expect(detectDocumentCategory("ktp.jpeg", null)).toBe("image");
      expect(detectDocumentCategory("diagram.webp", "image/webp")).toBe("image");
      expect(detectDocumentCategory("icon.svg", "image/svg+xml")).toBe("image");
    });

    it("detects Word documents correctly", () => {
      expect(
        detectDocumentCategory(
          "agreement.docx",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      ).toBe("word");
      expect(detectDocumentCategory("notes.doc", "application/msword")).toBe("word");
    });

    it("detects text and other types correctly", () => {
      expect(detectDocumentCategory("log.txt", "text/plain")).toBe("text");
      expect(detectDocumentCategory("data.csv", "text/csv")).toBe("text");
      expect(detectDocumentCategory("archive.zip", "application/zip")).toBe("other");
    });
  });

  describe("DocumentPreviewModal rendering", () => {
    it("renders PDF document inline", async () => {
      const onClose = vi.fn();
      render(
        <DocumentPreviewModal
          open={true}
          onClose={onClose}
          items={[
            {
              id: "doc-1",
              fileName: "customer_contract.pdf",
              mimeType: "application/pdf",
              url: "https://example.com/contract.pdf",
            },
          ]}
        />,
      );

      expect(screen.getAllByText("customer_contract.pdf")[0]).toBeInTheDocument();
      expect(screen.getByText("PDF")).toBeInTheDocument();

      const objectElement = document.querySelector("object");
      expect(objectElement).toBeInTheDocument();
      expect(objectElement?.getAttribute("type")).toBe("application/pdf");
    });

    it("renders image document inline and handles zoom & rotate controls", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <DocumentPreviewModal
          open={true}
          onClose={onClose}
          items={[
            {
              id: "img-1",
              fileName: "ktp_card.png",
              mimeType: "image/png",
              url: "https://example.com/ktp.png",
            },
          ]}
        />,
      );

      expect(screen.getAllByText("ktp_card.png")[0]).toBeInTheDocument();
      expect(screen.getByText("IMAGE")).toBeInTheDocument();

      const img = screen.getByRole("img", { name: "ktp_card.png" });
      expect(img).toBeInTheDocument();

      // Zoom In
      const zoomInBtn = screen.getByRole("button", { name: /Zoom In/i });
      await user.click(zoomInBtn);
      expect(screen.getByText("125%")).toBeInTheDocument();

      // Rotate
      const rotateBtn = screen.getByRole("button", { name: /Rotate 90°/i });
      await user.click(rotateBtn);

      // Reset Zoom
      const resetBtn = screen.getByRole("button", { name: /Reset Zoom/i });
      await user.click(resetBtn);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("renders Word document inline using parsed HTML", async () => {
      vi.mocked(docxParser.convertDocxToHtml).mockResolvedValueOnce({
        html: "<h1>Employment Contract</h1><p>Full-time showroom sales agreement</p>",
        messages: [],
        isSuccess: true,
      });

      // Mock fetch
      window.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      } as any);

      render(
        <DocumentPreviewModal
          open={true}
          onClose={vi.fn()}
          items={[
            {
              id: "doc-word-1",
              fileName: "contract.docx",
              mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              url: "https://example.com/contract.docx",
            },
          ]}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Employment Contract")).toBeInTheDocument();
        expect(
          screen.getByText("Full-time showroom sales agreement"),
        ).toBeInTheDocument();
      });
    });

    it("renders fallback for unsupported file types and triggers download", async () => {
      const user = userEvent.setup();
      render(
        <DocumentPreviewModal
          open={true}
          onClose={vi.fn()}
          items={[
            {
              id: "doc-zip-1",
              fileName: "firmware.bin",
              mimeType: "application/octet-stream",
              url: "https://example.com/firmware.bin",
            },
          ]}
        />,
      );

      expect(screen.getAllByText("firmware.bin")[0]).toBeInTheDocument();
      expect(screen.getByText("OTHER")).toBeInTheDocument();
      expect(
        screen.getByText(/This file type cannot be rendered inline in the previewer/i),
      ).toBeInTheDocument();

      const downloadBtn = screen.getAllByRole("button", {
        name: /Download/i,
      })[0];
      await user.click(downloadBtn);
      expect(documentsApi.downloadDocument).toHaveBeenCalled();
    });

    it("supports multi-document carousel navigation (Next / Previous)", async () => {
      const user = userEvent.setup();
      const items = [
        {
          id: "item-1",
          fileName: "file_one.pdf",
          mimeType: "application/pdf",
          url: "https://example.com/one.pdf",
        },
        {
          id: "item-2",
          fileName: "file_two.png",
          mimeType: "image/png",
          url: "https://example.com/two.png",
        },
      ];

      render(
        <DocumentPreviewModal
          open={true}
          onClose={vi.fn()}
          items={items}
          initialIndex={0}
        />,
      );

      expect(screen.getAllByText("file_one.pdf")[0]).toBeInTheDocument();
      expect(screen.getByText("1 of 2")).toBeInTheDocument();

      const nextBtn = screen.getByRole("button", { name: /^Next$/i });
      await user.click(nextBtn);

      expect(screen.getAllByText("file_two.png")[0]).toBeInTheDocument();
      expect(screen.getByText("2 of 2")).toBeInTheDocument();

      const prevBtn = screen.getByRole("button", { name: /^Previous$/i });
      await user.click(prevBtn);

      expect(screen.getAllByText("file_one.pdf")[0]).toBeInTheDocument();
    });

    it("calls onClose when Close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <DocumentPreviewModal
          open={true}
          onClose={onClose}
          items={[
            {
              id: "item-1",
              fileName: "file.pdf",
              mimeType: "application/pdf",
              url: "https://example.com/file.pdf",
            },
          ]}
        />,
      );

      const closeBtn = screen.getByRole("button", { name: /Close \(Esc\)/i });
      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
