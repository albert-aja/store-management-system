import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useSessionBootstrap } from "./hooks/useSessionBootstrap";
import LoginPage from "./pages/LoginPage";
import StoreListPage from "./features/stores/StoreListPage";
import CustomerListPage from "./features/customers/CustomerListPage";
import CustomerDetailPage from "./features/customers/CustomerDetailPage";
import ProductListPage from "./features/products/ProductListPage";
import ProductDetailPage from "./features/products/ProductDetailPage";
import StockUnitListPage from "./features/inventory/StockUnitListPage";
import SalesOrderListPage from "./features/salesOrders/SalesOrderListPage";
import SalesOrderDetailPage from "./features/salesOrders/SalesOrderDetailPage";
import EmployeeListPage from "./features/employees/EmployeeListPage";
import RolePermissionsPage from "./features/roles/RolePermissionsPage";
import ApprovalWorkflowsPage from "./features/approvals/ApprovalWorkflowsPage";
import SupplierListPage from "./features/procurement/SupplierListPage";
import SupplierDetailPage from "./features/procurement/SupplierDetailPage";
import PurchaseOrderListPage from "./features/procurement/PurchaseOrderListPage";
import PurchaseOrderDetailPage from "./features/procurement/PurchaseOrderDetailPage";
import DeliveryTripListPage from "./features/delivery/DeliveryTripListPage";
import DeliveryTripDetailPage from "./features/delivery/DeliveryTripDetailPage";
import FinancePage from "./features/finance/FinancePage";
import ExpenseBudgetPage from "./features/expense/ExpenseBudgetPage";
import RepossessionWarrantyPage from "./features/repossession/RepossessionWarrantyPage";
import PayrollPage from "./features/payroll/PayrollPage";
import DashboardPage from "./features/reporting/DashboardPage";

export default function App() {
  useSessionBootstrap();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <StoreListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CustomerListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CustomerDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProductListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProductDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <AppLayout>
              <StockUnitListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-orders"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SalesOrderListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-orders/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SalesOrderDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EmployeeListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RolePermissionsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ApprovalWorkflowsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SupplierListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SupplierDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-orders"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PurchaseOrderListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-orders/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PurchaseOrderDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery-trips"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DeliveryTripListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery-trips/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DeliveryTripDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FinancePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ExpenseBudgetPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/returns"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RepossessionWarrantyPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PayrollPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
