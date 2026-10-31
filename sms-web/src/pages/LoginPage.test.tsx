import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";

vi.mock("../lib/supabaseClient", () => ({
  supabase: { auth: { signInWithPassword: vi.fn() } },
}));

describe("management sign-in localization", () => {
  it("switches the login form language and remembers the selection", () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: "staff@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Indonesian" }));

    expect(screen.getByRole("heading", { name: "Selamat datang kembali" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveValue("staff@example.com");
    expect(screen.getByLabelText(/Kata sandi/)).toBeInTheDocument();
    expect(localStorage.getItem("sms-management-language")).toBe("id");
  });
});
