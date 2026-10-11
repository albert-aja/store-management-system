import type { ReactNode } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../store/authStore";
import NotificationBell from "../features/notifications/NotificationBell";

const TABS = [
  { path: "/", label: "Stores" },
  { path: "/customers", label: "Customers" },
  { path: "/products", label: "Products" },
  { path: "/inventory", label: "Inventory" },
  { path: "/sales-orders", label: "Sales Orders" },
  { path: "/suppliers", label: "Suppliers" },
  { path: "/purchase-orders", label: "Purchase Orders" },
  { path: "/delivery-trips", label: "Deliveries" },
  { path: "/finance", label: "Finance" },
  { path: "/expenses", label: "Expenses & Budget" },
  { path: "/returns", label: "Returns & Warranty" },
  { path: "/payroll", label: "HR & Payroll" },
  { path: "/reports", label: "Reports" },
  { path: "/employees", label: "Employees" },
  { path: "/roles", label: "Roles" },
  { path: "/approvals", label: "Approvals" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const employee = useAuthStore((s) => s.employee);

  const activeTab =
    TABS.find(
      (t) =>
        t.path === location.pathname ||
        (t.path !== "/" && location.pathname.startsWith(`${t.path}/`)),
    )?.path ?? false;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 4 }}>
            SMS
          </Typography>
          <Tabs
            value={activeTab}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ flexGrow: 1 }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.path}
                value={tab.path}
                label={tab.label}
                onClick={() => navigate(tab.path)}
              />
            ))}
          </Tabs>
          <NotificationBell />
          <Typography sx={{ mx: 2 }}>{employee?.fullName}</Typography>
          <Button color="inherit" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 3, flex: 1 }} maxWidth="xl">
        {children}
      </Container>
    </Box>
  );
}
