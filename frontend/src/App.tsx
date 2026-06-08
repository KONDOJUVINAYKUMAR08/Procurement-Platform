import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './modules/identity/Login';
import ForgotPassword from './modules/identity/ForgotPassword';
import ResetPassword from './modules/identity/ResetPassword';
import Dashboard from './modules/dashboard/Dashboard';
import Vendors from './modules/procurement/Vendors';
import VendorDetail from './modules/procurement/VendorDetail';
import PurchaseRequests from './modules/procurement/PurchaseRequests';
import PurchaseOrders from './modules/procurement/PurchaseOrders';
import Contracts from './modules/procurement/Contracts';
import Invoices from './modules/finance/Invoices';
import Documents from './modules/document/Documents';
import Notifications from './modules/document/Notifications';
import AuditLogs from './modules/document/AuditLogs';
import Reports from './modules/dashboard/Reports';
import UserManagement from './modules/identity/UserManagement';
import Settings from './modules/identity/Settings';
import LoadingScreen from './components/common/LoadingScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="vendors/:id" element={<VendorDetail />} />
        <Route path="purchase-requests" element={<PurchaseRequests />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="documents" element={<Documents />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
