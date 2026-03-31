import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/shared/ProtectedRoute';
import RoleGate from './components/shared/RoleGate';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersListPage from './pages/users/UsersListPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import SuppliersListPage from './pages/suppliers/SuppliersListPage';
import SupplierFormPage from './pages/suppliers/SupplierFormPage';

// Inventory
import EntriesListPage from './pages/inventory/EntriesListPage';
import ExitsListPage from './pages/inventory/ExitsListPage';

// Materials
import MaterialsListPage from './pages/materials/MaterialsListPage';
import MaterialFormPage from './pages/materials/MaterialFormPage';

// Work Orders
import WorkOrdersListPage from './pages/work-orders/WorkOrdersListPage';
import WorkOrderFormPage from './pages/work-orders/WorkOrderFormPage';
import WorkOrderDetailPage from './pages/work-orders/WorkOrderDetailPage';

// Sales
import SalesListPage from './pages/sales/SalesListPage';
import SaleFormPage from './pages/sales/SaleFormPage';

// Alerts
import AlertsPage from './pages/alerts/AlertsPage';

// Audit Log
import AuditLogPage from './pages/audit/AuditLogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/users"
                element={
                  <RoleGate roles={['admin']} fallback={<Navigate to="/dashboard" replace />}>
                    <UsersListPage />
                  </RoleGate>
                }
              />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/suppliers" element={<SuppliersListPage />} />
              <Route path="/suppliers/new" element={<SupplierFormPage />} />
              <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />

              {/* Inventory */}
              <Route path="/inventory/entries" element={<EntriesListPage />} />
              <Route path="/inventory/exits" element={<ExitsListPage />} />

              {/* Materials */}
              <Route path="/materials" element={<MaterialsListPage />} />
              <Route path="/materials/new" element={<MaterialFormPage />} />
              <Route path="/materials/:id/edit" element={<MaterialFormPage />} />

              {/* Work Orders */}
              <Route path="/work-orders" element={<WorkOrdersListPage />} />
              <Route
                path="/work-orders/new"
                element={
                  <RoleGate roles={['admin', 'warehouse']} fallback={<Navigate to="/work-orders" replace />}>
                    <WorkOrderFormPage />
                  </RoleGate>
                }
              />
              <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />

              {/* Sales */}
              <Route path="/sales" element={<SalesListPage />} />
              <Route
                path="/sales/new"
                element={
                  <RoleGate roles={['admin', 'warehouse']} fallback={<Navigate to="/sales" replace />}>
                    <SaleFormPage />
                  </RoleGate>
                }
              />

              {/* Alerts */}
              <Route path="/alerts" element={<AlertsPage />} />

              {/* Audit Log — no RoleGate here, AuditLogPage guards internally */}
              <Route path="/audit" element={<AuditLogPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
