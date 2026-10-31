import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SupplierPaymentPanel from "./SupplierPaymentPanel";
import { formatNumber } from "../../lib/locale";

vi.mock("notistack", () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
}));

const mockRecordMutate = vi.fn();

vi.mock("./hooks", () => ({
  useSupplierPayments: vi.fn(() => ({
    data: [
      {
        id: "p-1",
        purchaseOrderId: "po-1",
        amount: 500000,
        paidAt: "2026-10-01T10:00:00Z",
        notes: "Down payment",
      },
    ],
  })),
  useTotalPaid: vi.fn(() => ({
    data: 500000,
  })),
  useRecordSupplierPayment: vi.fn(() => ({
    mutate: mockRecordMutate,
  })),
}));

describe("SupplierPaymentPanel", () => {
  it("renders existing payments and total paid", () => {
    render(
      <SupplierPaymentPanel
        purchaseOrderId="po-1"
        poCancelled={false}
        poTotal={1000000}
      />,
    );

    const paidFormatted = formatNumber(500000, "en");
    const totalFormatted = formatNumber(1000000, "en");

    expect(screen.getByText(/Supplier Payments/i)).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(paidFormatted)).length).toBeGreaterThan(0);
    expect(screen.getByText(totalFormatted)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Remaining:.*${paidFormatted}`))).toBeInTheDocument();
  });

  it("shows PAID IN FULL when paid amount equals or exceeds poTotal", () => {
    render(
      <SupplierPaymentPanel
        purchaseOrderId="po-1"
        poCancelled={false}
        poTotal={500000}
      />,
    );

    expect(screen.getByText("PAID IN FULL")).toBeInTheDocument();
  });

  it("submits payment when form is filled and submitted", async () => {
    render(
      <SupplierPaymentPanel
        purchaseOrderId="po-1"
        poCancelled={false}
        poTotal={1000000}
      />,
    );

    const amountInput = screen.getByLabelText(/amount/i);
    await userEvent.type(amountInput, "250000");

    const notesInput = screen.getByLabelText(/notes/i);
    await userEvent.type(notesInput, "Partial balance");

    const submitBtn = screen.getByRole("button", { name: /record payment/i });
    await userEvent.click(submitBtn);

    expect(mockRecordMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseOrderId: "po-1",
        amount: 250000,
        notes: "Partial balance",
      }),
      expect.anything(),
    );
  });
});
