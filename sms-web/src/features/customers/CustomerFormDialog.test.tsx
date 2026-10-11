import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CustomerFormDialog from "./CustomerFormDialog";

describe("CustomerFormDialog", () => {
  it("blocks submit when full name is empty", async () => {
    const onSubmit = vi.fn();
    render(
      <CustomerFormDialog
        open
        initial={null}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText("Full name is required"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an invalid email but allows a valid submission", async () => {
    const onSubmit = vi.fn();
    render(
      <CustomerFormDialog
        open
        initial={null}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await userEvent.type(
      screen.getByLabelText(/primary email/i),
      "not-an-email",
    );
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText(/primary email/i));
    await userEvent.type(
      screen.getByLabelText(/primary email/i),
      "jane@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Jane Doe",
          primaryEmail: "jane@example.com",
        }),
        expect.anything(),
      ),
    );
  });
});
