// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeliveryReschedulePanel } from "./DeliveryReschedulePanel";

const mocks = vi.hoisted(() => ({
  auth: { user: { customerId: "customer-1" } as { customerId: string } | null, isLoading: false },
  schedules: vi.fn(),
  request: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("../services/api", () => ({
  storefrontApi: { getDeliverySchedules: mocks.schedules, requestDeliveryReschedule: mocks.request },
}));
const stop = {
  deliveryOrderId: "do-1", deliveryOrderNumber: "DO-1", deliveryDate: "2026-11-05",
  deliveryWindow: "MORNING", plannedDispatchAt: "2026-11-05T02:00:00Z",
  eligible: true, unavailableReason: null, requests: [],
};
function open() {
  return render(<MemoryRouter><DeliveryReschedulePanel orderId="order-1" /></MemoryRouter>);
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.user = { customerId: "customer-1" };
  mocks.schedules.mockResolvedValue([stop]);
  mocks.request.mockResolvedValue({ id: "request-1", status: "PENDING" });
});
afterEach(cleanup);

describe("Customer rescheduling", () => {
  it("requires sign-in without fetching private schedules", () => {
    mocks.auth.user = null;
    open();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/auth");
    expect(mocks.schedules).not.toHaveBeenCalled();
  });

  it("submits chosen date/window and explicitly awaits approval", async () => {
    open();
    await screen.findByText("DO-1");
    fireEvent.change(screen.getByLabelText("Tanggal pengiriman baru"), { target: { value: "2026-11-06" } });
    fireEvent.change(screen.getByLabelText("Waktu pengiriman (WIB)"), { target: { value: "AFTERNOON" } });
    fireEvent.change(screen.getByLabelText("Alasan (opsional)"), { target: { value: "Changed availability" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajukan perubahan jadwal" }));
    await screen.findByRole("status");
    expect(mocks.request).toHaveBeenCalledWith("do-1", {
      requestedDate: "2026-11-06", requestedWindow: "AFTERNOON", reason: "Changed availability",
    });
    expect(screen.getByRole("status").textContent).toContain("Jadwal belum berubah");
    expect(mocks.schedules).toHaveBeenCalledTimes(2);
  });

  it("shows backend cutoff errors without pretending request succeeded", async () => {
    mocks.request.mockRejectedValue(new Error("Reschedule requests close 24 hours before planned dispatch"));
    open();
    await screen.findByText("DO-1");
    fireEvent.change(screen.getByLabelText("Tanggal pengiriman baru"), { target: { value: "2026-11-06" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajukan perubahan jadwal" }));
    expect((await screen.findByRole("alert")).textContent).toContain("24 jam");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows pending/rejected decisions and removes ineligible forms", async () => {
    mocks.schedules.mockResolvedValue([{
      ...stop, eligible: false, unavailableReason: "Already awaiting review",
      requests: [
        { id: "r1", requestedDate: "2026-11-06", requestedWindow: "AFTERNOON", status: "PENDING", decisionNotes: null },
        { id: "r2", requestedDate: "2026-11-04", requestedWindow: "MORNING", status: "REJECTED", decisionNotes: "No capacity" },
      ],
    }]);
    open();
    await screen.findByText(/Menunggu persetujuan/);
    expect(screen.getByText(/No capacity/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ajukan perubahan jadwal" })).toBeNull();
  });

  it("clears private schedules on account switch and renders fetch errors", async () => {
    const view = open();
    await screen.findByText("DO-1");
    mocks.auth.user = { customerId: "customer-2" };
    mocks.schedules.mockRejectedValue(new Error("Cannot reschedule another customer's delivery"));
    view.rerender(<MemoryRouter><DeliveryReschedulePanel orderId="order-1" /></MemoryRouter>);
    await screen.findByRole("alert");
    await waitFor(() => expect(screen.queryByText("DO-1")).toBeNull());
  });
});
