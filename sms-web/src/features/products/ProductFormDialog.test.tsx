import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProductFormDialog from "./ProductFormDialog";

describe("ProductFormDialog", () => {
  it("blocks submit when name is empty", async () => {
    const onSubmit = vi.fn();
    render(
      <ProductFormDialog
        open
        initial={null}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
