import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: ReactNode;
  requiredPermission?: string;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
}: Props) {
  const employee = useAuthStore((s) => s.employee);
  const loaded = useAuthStore((s) => s.loaded);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (!loaded) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (!employee) {
    return <Navigate to="/login" replace />;
  }
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
