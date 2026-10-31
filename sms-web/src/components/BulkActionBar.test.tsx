import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BulkActionBar from "./BulkActionBar";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

describe("BulkActionBar", () => {
  it("renders when rows are selected and triggers clear and action callbacks", async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();
    const handleStatusConfirm = vi.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <BulkActionBar
          selectedRowIds={[]}
          onClearSelection={handleClear}
        />
      </ThemeProvider>
    );

    // Hidden when empty
    expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();

    // Rerender with 3 selected rows
    rerender(
      <ThemeProvider theme={theme}>
        <BulkActionBar
          selectedRowIds={["id-1", "id-2", "id-3"]}
          totalCount={10}
          onClearSelection={handleClear}
          columns={[{ field: "name", headerName: "Name" }]}
          rows={[{ id: "id-1", name: "Item 1" }]}
          statusUpdate={{
            title: "Update Order Status",
            statusOptions: [{ value: "CONFIRM", label: "Confirm" }],
            onConfirm: handleStatusConfirm,
          }}
          printOptions={[{ type: "INVOICE", label: "Print Receipt" }]}
        />
      </ThemeProvider>
    );

    // Chip shows selected count
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change Status/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Print Receipt/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export/i })).toBeInTheDocument();

    // Click Deselect All
    const clearBtn = screen.getByRole("button", { name: /Deselect All/i });
    await user.click(clearBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);

    // Open status update modal
    const statusBtn = screen.getByRole("button", { name: /Change Status/i });
    await user.click(statusBtn);
    expect(screen.getByText("Update Order Status")).toBeInTheDocument();
  });
});
