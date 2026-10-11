import { useEffect } from "react";
import { apiClient } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../store/authStore";

interface MeResponse {
  employeeId: string;
  fullName: string;
  roleCodes: string[];
  permissionCodes: string[];
  storeIds: string[];
}

/** Loads the employee profile (roles/permissions/store scope) whenever the Supabase session changes. */
export function useSessionBootstrap() {
  const setEmployee = useAuthStore((s) => s.setEmployee);
  const setLoaded = useAuthStore((s) => s.setLoaded);

  useEffect(() => {
    const loadProfile = async (hasSession: boolean) => {
      if (!hasSession) {
        setEmployee(null);
        setLoaded(true);
        return;
      }
      try {
        const { data } = await apiClient.get<MeResponse>("/api/me");
        setEmployee({
          id: data.employeeId,
          fullName: data.fullName,
          roleCodes: data.roleCodes,
          permissionCodes: data.permissionCodes,
          storeIds: data.storeIds,
        });
      } finally {
        setLoaded(true);
      }
    };

    supabase.auth.getSession().then(({ data }) => loadProfile(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoaded(false);
      loadProfile(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, [setEmployee, setLoaded]);
}
