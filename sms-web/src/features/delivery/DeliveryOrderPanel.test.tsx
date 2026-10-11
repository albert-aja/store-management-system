import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SalesOrderItem } from "../salesOrders/types";
import DeliveryOrderPanel from "./DeliveryOrderPanel";

vi.mock("notistack", () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
}));

const mockCreateDOMutate = vi.fn();

vi.mock("./hooks", () => ({
  useDeliveryOrdersBySalesOrder: vi.fn(() => ({
    data: [
      {
        id: "do-1",
        salesOrderId: "so-1",
        tripId: "trip-1",
        deliveryOrderNumber: "DO-202610-0001",
        tripNumber: "TRIP-202610-0001",
        destinationAddress: "Jl. Sudirman No. 12, Jakarta",
        recipientName: "Budi Santoso",
        recipientPhone: "08123456789",
        status: "DELIVERED",
        deliveredAt: "2026-10-08T10:00:00Z",
        signedBy: "Budi Santoso",
        proofPhotoUrl: null,
        notes: null,
        codAmount: 0,
        codCollected: 0,
        failureReason: null,
        rescheduledTripId: null,
        items: [
          {
            id: "doi-1",
            deliveryOrderId: "do-1",
            salesOrderItemStockUnitId: "soisu-1",
            productName: "Air Conditioner 1PK",
            variantName: "Standard Inverter",
            sku: "AC-1PK-STD",
            manufacturerSerial: "SN-998877",
            status: "DELIVERED",
            inspectedOk: true,
            inspectionNotes: null,
          },
        ],
        createdAt: "2026-10-08T08:00:00Z",
      },
    ],
  })),
  useDeliveryTrips: vi.fn(() => ({
    data: [
      {
        id: "trip-1",
        tripNumber: "TRIP-202610-0001",
        storeId: "store-1",
        storeName: "Main Store",
        driverName: "John Doe",
        helperName: "Jane Helper",
        vehiclePlate: "B 1234 ABC",
        status: "PLANNED",
        preInspectionDone: false,
        preInspectionNotes: null,
        departedAt: null,
        completedAt: null,
        notes: null,
        orders: [],
        createdAt: "2026-10-08T07:00:00Z",
      },
    ],
  })),
  useCreateDeliveryOrder: vi.fn(() => ({
    mutate: mockCreateDOMutate,
    isPending: false,
  })),
}));

vi.mock("../inventory/hooks", () => ({
  useAllocations: vi.fn(() => ({
    data: [
      {
        id: "soisu-1",
        salesOrderItemId: "soi-1",
        stockUnitId: "su-11112222",
        allocatedAt: "2026-10-08T08:00:00Z",
        releasedAt: null,
      },
    ],
  })),
}));

describe("DeliveryOrderPanel", () => {
  const dummyItems: SalesOrderItem[] = [
    {
      id: "soi-1",
      productVariantId: "pv-1",
      variantName: "Standard Inverter",
      quantity: 1,
      paymentTermMonths: 0,
      referencePrice: 3500000,
      finalPrice: 3500000,
      notes: null,
    },
  ];

  it("renders deliveries header and existing delivery order", () => {
    render(
      <DeliveryOrderPanel
        salesOrderId="so-1"
        storeId="store-1"
        deliveryAddressSnapshot="Jl. Sudirman No. 12, Jakarta"
        items={dummyItems}
        isReleasedOrConfirmed={true}
      />,
    );

    expect(screen.getByText(/Deliveries & Outbound/i)).toBeInTheDocument();
    expect(screen.getByText("DO-202610-0001")).toBeInTheDocument();
    expect(screen.getByText("DELIVERED")).toBeInTheDocument();
    expect(screen.getByText(/Trip: TRIP-202610-0001/i)).toBeInTheDocument();
  });

  it("shows Create Delivery Order button and opens creation dialog", async () => {
    const user = userEvent.setup();
    render(
      <DeliveryOrderPanel
        salesOrderId="so-1"
        storeId="store-1"
        deliveryAddressSnapshot="Jl. Sudirman No. 12, Jakarta"
        items={dummyItems}
        isReleasedOrConfirmed={true}
      />,
    );

    const createBtn = screen.getByRole("button", { name: /\+ Create Delivery Order/i });
    expect(createBtn).toBeInTheDocument();

    await user.click(createBtn);

    expect(screen.getByText(/Create Outbound Delivery Order/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jl. Sudirman No. 12, Jakarta")).toBeInTheDocument();
  });
});
