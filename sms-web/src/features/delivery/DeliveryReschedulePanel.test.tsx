import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeliveryReschedulePanel, PlannedDispatchEditor } from "./DeliveryReschedulePanel";
import type { DeliveryTrip } from "./types";
import { setLanguage } from "../../lib/locale";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), schedule: vi.fn() }));
vi.mock("../../lib/apiClient", () => ({ apiClient: { get: mocks.get, post: mocks.post } }));
vi.mock("./api", () => ({ deliveryTripsApi: { schedule: mocks.schedule } }));
vi.mock("./hooks", () => ({
  useDeliveryTrips: () => ({ data: [
    { id: "trip-1", tripNumber: "TRIP-1", scheduledDate: "2026-11-06", plannedDispatchAt: "2026-11-06T02:00:00Z" },
  ] }),
}));

function wrap(child: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })}>{child}</QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue({ data: [{
    id: "request-1", deliveryOrderNumber: "DO-1", storeId: "store-1",
    requestedDate: "2026-11-06", requestedWindow: "MORNING", reason: "Requested shift",
  }] });
  mocks.post.mockResolvedValue({ data: {} });
  mocks.schedule.mockResolvedValue({});
});

describe("Dispatcher review", () => {
  it("approves only explicitly selected matching trip", async () => {
    const user = userEvent.setup();
    wrap(<DeliveryReschedulePanel />);
    await screen.findByText("DO-1");
    expect(screen.getByRole("button", { name: "Approve request" })).toBeDisabled();
    await user.click(screen.getByRole("combobox", { name: "Assign requested stop to trip" }));
    await user.click(screen.getByRole("option", { name: /TRIP-1/ }));
    await user.click(screen.getByRole("button", { name: "Approve request" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/api/delivery-reschedules/request-1/approve",
      { targetTripId: "trip-1", notes: undefined }));
  });

  it("requires rejection reason and exposes backend conflicts", async () => {
    const user = userEvent.setup();
    mocks.post.mockRejectedValue(new Error("Schedule changed; refresh"));
    wrap(<DeliveryReschedulePanel />);
    await screen.findByText("DO-1");
    expect(screen.getByRole("button", { name: "Reject request" })).toBeDisabled();
    await user.type(screen.getByLabelText("Decision notes (required for rejection)"), "No capacity");
    await user.click(screen.getByRole("button", { name: "Reject request" }));
    expect(await screen.findByText("Schedule changed; refresh")).toBeInTheDocument();
    expect(mocks.post).toHaveBeenCalledWith("/api/delivery-reschedules/request-1/reject",
      { targetTripId: undefined, notes: "No capacity" });
  });

  it("translates a known Q.33 business error and leaves dispatcher data unchanged", async () => {
    setLanguage("id");
    const user = userEvent.setup();
    mocks.post.mockRejectedValue(new Error("Trip has already dispatched or is no longer planned"));
    wrap(<DeliveryReschedulePanel />);
    await screen.findByText("DO-1");
    await user.click(screen.getByRole("combobox", { name: "Tetapkan pemberhentian yang diminta ke perjalanan" }));
    await user.click(screen.getByRole("option", { name: /TRIP-1/ }));
    await user.click(screen.getByRole("button", { name: "Setujui permintaan" }));
    expect(await screen.findByText("Perjalanan sudah diberangkatkan atau tidak lagi berstatus terencana")).toBeInTheDocument();
    expect(mocks.post).toHaveBeenCalledWith("/api/delivery-reschedules/request-1/approve",
      { targetTripId: "trip-1", notes: undefined });
  });

  it("writes explicit WIB offset rather than browser timezone", async () => {
    const trip: DeliveryTrip = {
      id: "trip-1", tripNumber: "TRIP-1", storeId: "store-1", storeName: null,
      driverEmployeeId: "driver-1", driverName: null, helperEmployeeId: null,
      helperName: null, vehiclePlate: null, scheduledDate: "2026-11-06",
      status: "PLANNED", departedAt: null, completedAt: null, notes: null, createdAt: "",
    };
    const user = userEvent.setup();
    wrap(<PlannedDispatchEditor trip={trip} />);
    const input = screen.getByLabelText("New planned dispatch (WIB)");
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(input, { target: { value: "2026-11-06T09:00" } });
    await user.click(screen.getByRole("button", { name: "Save dispatch time" }));
    await waitFor(() => expect(mocks.schedule).toHaveBeenCalledWith("trip-1", "2026-11-06T09:00:00+07:00"));
  });
});
