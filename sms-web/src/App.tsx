import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PageSkeleton from "./components/PageSkeleton";
import { useSessionBootstrap } from "./hooks/useSessionBootstrap";

// Route-level code splitting & lazy loading
const LoginPage = lazy(() => import("./pages/LoginPage"));
const StoreListPage = lazy(() => import("./features/stores/StoreListPage"));
const CustomerListPage = lazy(() => import("./features/customers/CustomerListPage"));
const CustomerDetailPage = lazy(() => import("./features/customers/CustomerDetailPage"));
const ProductListPage = lazy(() => import("./features/products/ProductListPage"));
const ProductDetailPage = lazy(() => import("./features/products/ProductDetailPage"));
const StockUnitListPage = lazy(() => import("./features/inventory/StockUnitListPage"));
const SalesOrderListPage = lazy(() => import("./features/salesOrders/SalesOrderListPage"));
const SalesOrderDetailPage = lazy(() => import("./features/salesOrders/SalesOrderDetailPage"));
const EmployeeListPage = lazy(() => import("./features/employees/EmployeeListPage"));
const RolePermissionsPage = lazy(() => import("./features/roles/RolePermissionsPage"));
const ApprovalWorkflowsPage = lazy(() => import("./features/approvals/ApprovalWorkflowsPage"));
const SupplierListPage = lazy(() => import("./features/procurement/SupplierListPage"));
const SupplierDetailPage = lazy(() => import("./features/procurement/SupplierDetailPage"));
const PurchaseOrderListPage = lazy(() => import("./features/procurement/PurchaseOrderListPage"));
const PurchaseOrderDetailPage = lazy(() => import("./features/procurement/PurchaseOrderDetailPage"));
const DeliveryTripListPage = lazy(() => import("./features/delivery/DeliveryTripListPage"));
const DeliveryTripDetailPage = lazy(() => import("./features/delivery/DeliveryTripDetailPage"));
const FleetMonitoringPage = lazy(() => import("./features/fleet/FleetMonitoringPage"));
const FinancePage = lazy(() => import("./features/finance/FinancePage"));
const ExpenseBudgetPage = lazy(() => import("./features/expense/ExpenseBudgetPage"));
const RepossessionWarrantyPage = lazy(() => import("./features/repossession/RepossessionWarrantyPage"));
const PayrollPage = lazy(() => import("./features/payroll/PayrollPage"));
const DashboardPage = lazy(() => import("./features/reporting/DashboardPage"));
const PriceListPage = lazy(() => import("./features/pricing/PriceListPage"));

export default function App() {
  useSessionBootstrap();

  return (
    <Suspense fallback={<PageSkeleton />}>
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
          path="/price-list"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PriceListPage />
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
          path="/fleet"
          element={
            <ProtectedRoute>
              <AppLayout>
                <FleetMonitoringPage />
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
    </Suspense>
  );
}
