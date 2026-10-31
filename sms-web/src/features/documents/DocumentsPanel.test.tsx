import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import DocumentsPanel from "./DocumentsPanel";
import * as hooks from "./hooks";
import { documentsApi } from "./api";

vi.mock("./hooks", () => ({
  useDocuments: vi.fn(),
  useUploadDocument: vi.fn(),
}));

vi.mock("./api", () => ({
  documentsApi: {
    downloadDocument: vi.fn(),
    getDownloadTicket: vi.fn(),
  },
}));

vi.mock("notistack", () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
}));

describe("DocumentsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooks.useUploadDocument).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it("renders empty state when there are no documents", () => {
    vi.mocked(hooks.useDocuments).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<DocumentsPanel ownerType="CUSTOMER" ownerId="cust-123" />);

    expect(screen.getByText("Attached Documents")).toBeInTheDocument();
    expect(
      screen.getByText("No document attachments found for this record."),
    ).toBeInTheDocument();
    expect(screen.getByText("Upload Document")).toBeInTheDocument();
  });

  it("renders list of documents and opens universal preview modal on preview click", async () => {
    const user = userEvent.setup();
    const mockDocs = [
      {
        id: "doc-1",
        ownerType: "CUSTOMER",
        ownerId: "cust-123",
        storageBucket: "sms-documents",
        storagePath: "CUSTOMER/cust-123/id_card.pdf",
        fileName: "id_card.pdf",
        mimeType: "application/pdf",
        uploadedBy: "emp-1",
        uploadedAt: "2026-10-31T00:00:00Z",
      },
      {
        id: "doc-2",
        ownerType: "CUSTOMER",
        ownerId: "cust-123",
        storageBucket: "sms-documents",
        storagePath: "CUSTOMER/cust-123/sofa_specs.docx",
        fileName: "sofa_specs.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedBy: "emp-1",
        uploadedAt: "2026-10-31T00:00:00Z",
      },
    ];

    vi.mocked(hooks.useDocuments).mockReturnValue({
      data: mockDocs,
      isLoading: false,
    } as any);

    render(<DocumentsPanel ownerType="CUSTOMER" ownerId="cust-123" />);

    expect(screen.getByText("id_card.pdf")).toBeInTheDocument();
    expect(screen.getByText("sofa_specs.docx")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("WORD")).toBeInTheDocument();

    // Click preview on first document
    const previewButtons = screen.getAllByRole("button", {
      name: /Preview document: /i,
    });
    expect(previewButtons).toHaveLength(2);

    await user.click(previewButtons[0]);

    // Modal dialog should appear
    expect(
      screen.getByRole("dialog"),
    ).toBeInTheDocument();
  });

  it("calls downloadDocument when download button is clicked", async () => {
    const user = userEvent.setup();
    const mockDocs = [
      {
        id: "doc-1",
        ownerType: "CUSTOMER",
        ownerId: "cust-123",
        storageBucket: "sms-documents",
        storagePath: "CUSTOMER/cust-123/receipt.png",
        fileName: "receipt.png",
        mimeType: "image/png",
        uploadedBy: "emp-1",
        uploadedAt: "2026-10-31T00:00:00Z",
      },
    ];

    vi.mocked(hooks.useDocuments).mockReturnValue({
      data: mockDocs,
      isLoading: false,
    } as any);

    render(<DocumentsPanel ownerType="CUSTOMER" ownerId="cust-123" />);

    const downloadBtn = screen.getByRole("button", { name: "Download receipt.png" });
    await user.click(downloadBtn);

    expect(documentsApi.downloadDocument).toHaveBeenCalledWith(mockDocs[0]);
  });
});
