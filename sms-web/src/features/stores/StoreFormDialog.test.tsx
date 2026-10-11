import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StoreFormDialog from "./StoreFormDialog";

describe("StoreFormDialog", () => {
  it("shows validation errors and blocks submit when required fields are empty", async () => {
    const onSubmit = vi.fn();
    render(
      <StoreFormDialog
        open
        initial={null}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Code is required")).toBeInTheDocument();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits parsed values when the form is valid", async () => {
    const onSubmit = vi.fn();
    render(
      <StoreFormDialog
        open
        initial={null}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.type(screen.getByLabelText(/code/i), "STR01");
    await userEvent.type(screen.getByLabelText(/^name/i), "Downtown Store");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ code: "STR01", name: "Downtown Store" }),
        expect.anything(),
      ),
    );
  });
});
