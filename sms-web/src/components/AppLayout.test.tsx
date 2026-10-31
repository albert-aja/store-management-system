import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppLayout from "./AppLayout";
import { getAppTheme } from "../theme";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), notify: vi.fn() }));
vi.mock("../lib/supabaseClient", () => ({ supabase: { auth: { signOut: mocks.signOut } } }));
vi.mock("notistack", () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.notify }) }));
vi.mock("../features/notifications/NotificationBell", () => ({ default: () => <button aria-label="Notifications">Notifications</button> }));

function renderLayout(mobile = false) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: mobile && query.includes("max-width"), media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: () => true,
  }));
  return render(<ThemeProvider theme={getAppTheme("light")}><MemoryRouter initialEntries={["/customers/customer-1"]}>
    <AppLayout><h1>Customer profile</h1></AppLayout>
  </MemoryRouter></ThemeProvider>);
}

beforeEach(() => {
  mocks.signOut.mockReset().mockResolvedValue({ error: null });
  mocks.notify.mockReset();
  useThemeStore.setState({ mode: "light" });
  useAuthStore.setState({ employee: { id: "staff-1", fullName: "Demo Staff", roleCodes: [], permissionCodes: [], storeIds: [] } });
});
afterEach(() => { vi.unstubAllGlobals(); useAuthStore.setState({ employee: null }); });

describe("management navigation", () => {
  it("keeps every management route, grouped navigation and selected detail route", async () => {
    renderLayout();
    const nav = screen.getByRole("navigation", { name: "Management navigation" });
    expect(within(nav).getAllByRole("link")).toHaveLength(18);
    expect(within(nav).getByRole("link", { name: "Customers" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("main")).toHaveAttribute("id", "management-main");
    await userEvent.click(within(nav).getByRole("link", { name: "Fleet & Tracking" }));
    expect(within(nav).getByRole("link", { name: "Fleet & Tracking" })).toHaveAttribute("aria-current", "page");
  });

  it("opens phone drawer and closes it after navigation", async () => {
    renderLayout(true);
    const user = userEvent.setup();
    expect(screen.queryByRole("navigation", { name: "Management navigation" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const nav = await screen.findByRole("navigation", { name: "Management navigation" });
    await user.click(within(nav).getByRole("link", { name: "Reports" }));
    expect(await screen.findByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  });

  it("switches shell labels and persists the selected language", async () => {
    renderLayout();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Indonesian" }));

    expect(screen.getByRole("navigation", { name: "Navigasi manajemen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pelanggan" })).toHaveAttribute("aria-current", "page");
    expect(localStorage.getItem("sms-management-language")).toBe("id");
  });

  it("preserves theme toggle and reports failed sign-out", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Switch to Dark Mode" }));
    expect(useThemeStore.getState().mode).toBe("dark");
    mocks.signOut.mockResolvedValue({ error: new Error("Offline") });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(mocks.notify).toHaveBeenCalledWith("Unable to sign out. Please try again.", { variant: "error" });
    log.mockRestore();
  });
});
