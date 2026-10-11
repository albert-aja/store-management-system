import { create } from "zustand";

export interface EmployeeProfile {
  id: string;
  fullName: string;
  roleCodes: string[];
  permissionCodes: string[];
  storeIds: string[];
}

interface AuthState {
  employee: EmployeeProfile | null;
  loaded: boolean;
  setEmployee: (employee: EmployeeProfile | null) => void;
  setLoaded: (loaded: boolean) => void;
  hasRole: (roleCode: string) => boolean;
  hasPermission: (permissionCode: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  employee: null,
  loaded: false,
  setEmployee: (employee) => set({ employee }),
  setLoaded: (loaded) => set({ loaded }),
  hasRole: (roleCode) => get().employee?.roleCodes.includes(roleCode) ?? false,
  hasPermission: (permissionCode) =>
    get().employee?.permissionCodes.includes(permissionCode) ?? false,
}));
