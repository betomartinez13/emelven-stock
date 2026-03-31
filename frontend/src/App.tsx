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

// Materials
// Inventory
import EntriesListPage from './pages/inventory/EntriesListPage';
import ExitsListPage from './pages/inventory/ExitsListPage';

// Materials
import MaterialsListPage from './pages/materials/MaterialsListPage';
import MaterialFormPage from './pages/materials/MaterialFormPage';

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
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
