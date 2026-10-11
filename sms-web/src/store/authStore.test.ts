import { describe, expect, it, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ employee: null, loaded: false });
  });

  it("hasRole/hasPermission return false when no employee is loaded", () => {
    expect(useAuthStore.getState().hasRole("OWNER")).toBe(false);
    expect(useAuthStore.getState().hasPermission("STORE_MANAGE")).toBe(false);
  });

  it("hasRole/hasPermission reflect the loaded employee profile", () => {
    useAuthStore.getState().setEmployee({
      id: "e1",
      fullName: "Jane",
      roleCodes: ["MANAGER"],
      permissionCodes: ["EMPLOYEE_MANAGE"],
      storeIds: ["s1"],
    });

    expect(useAuthStore.getState().hasRole("MANAGER")).toBe(true);
    expect(useAuthStore.getState().hasRole("OWNER")).toBe(false);
    expect(useAuthStore.getState().hasPermission("EMPLOYEE_MANAGE")).toBe(true);
    expect(useAuthStore.getState().hasPermission("STORE_MANAGE")).toBe(false);
  });
});
