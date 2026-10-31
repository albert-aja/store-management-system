import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DeliveryRouteMap from "./DeliveryRouteMap";
import type { DeliveryOrder, DeliveryTrip } from "./types";

const trip: DeliveryTrip = {
  id: "trip-1", tripNumber: "DEMO-1", storeId: "store-1", storeName: "Demo store",
  driverEmployeeId: "staff-1", driverName: "Demo driver", helperEmployeeId: null,
  helperName: null, vehiclePlate: null, scheduledDate: "2026-10-31", status: "PLANNED",
  departedAt: null, completedAt: null, notes: null, createdAt: "2026-10-31",
};
const order = (id: string, status: DeliveryOrder["status"]): DeliveryOrder => ({
  id, deliveryOrderNumber: id, salesOrderId: "so-1", salesOrderNumber: null,
  deliveryTripId: trip.id, tripNumber: trip.tripNumber, destinationAddress: `${id} example address`,
  recipientName: `${id} recipient`, recipientPhone: null, stopSequence: id === "stop-1" ? 1 : 2,
  status, preInspectionPassed: false, preInspectionNotes: null, deliveredAt: null,
  signedBy: null, proofPhotoUrl: null, failureReason: null, codAmount: 0, codCollected: 0,
  codNotes: null, notes: null, createdAt: "2026-10-31", items: [],
});

describe("delivery stop sequence", () => {
  it("shows progress and explicitly distinguishes sequence from real road routing", () => {
    render(<DeliveryRouteMap trip={trip} orders={[order("stop-1", "DELIVERED"), order("stop-2", "PENDING")]} />);
    expect(screen.getByText("1/2 Completed")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText(/travel times are unavailable/)).toBeInTheDocument();
    expect(screen.queryByText(/Est. Distance/)).not.toBeInTheDocument();
  });

  it("preserves stop selection and delivery document printing", async () => {
    const select = vi.fn();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const second = order("stop-2", "PENDING");
    render(<DeliveryRouteMap trip={trip} orders={[order("stop-1", "DELIVERED"), second]} onSelectOrder={select} />);
    await userEvent.click(screen.getByText("stop-2 recipient"));
    expect(select).toHaveBeenCalledWith(second);
    await userEvent.click(screen.getByRole("button", { name: "Print Delivery Order (Surat Jalan)" }));
    expect(open).toHaveBeenCalledWith("/api/documents/print/surat-jalan/stop-2", "_blank", "noopener,noreferrer");
    open.mockRestore();
  });
});
