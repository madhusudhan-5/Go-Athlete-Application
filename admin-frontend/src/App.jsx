import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SuperAuthProvider, useSuperAuth } from './context/SuperAuthContext';
import AdminLayout from './layouts/AdminLayout';
import SuperLayout from './layouts/SuperLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VendorsPage from './pages/VendorsPage';
import VendorDetailPage from './pages/VendorDetailPage';
import KycPage from './pages/KycPage';
import BookingsPage from './pages/BookingsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';
import AppearancePage from './pages/settings/AppearancePage';
import CommissionsPage from './pages/settings/CommissionsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import SuperLoginPage from './pages/super/SuperLoginPage';
import SuperDashboardPage from './pages/super/SuperDashboardPage';
import AdminManagementPage from './pages/super/AdminManagementPage';
import SystemConfigPage from './pages/super/SystemConfigPage';
import SuperCommissionsPage from './pages/super/CommissionsPage';
import AnalyticsPage from './pages/super/AnalyticsPage';
import VendorOversightPage from './pages/super/VendorOversightPage';
import OffersPage from './pages/super/OffersPage';
import AuditLogsPage from './pages/super/AuditLogsPage';
import BroadcastPage from './pages/super/BroadcastPage';
import { Box, CircularProgress } from '@mui/material';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

function SuperProtectedRoute({ children }) {
  const { isAuthenticated, loading, isSuperAdmin } = useSuperAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/super/login" replace />;
  }

  return children;
}

function SuperPublicRoute({ children }) {
  const { isAuthenticated, loading, isSuperAdmin } = useSuperAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && isSuperAdmin) {
    return <Navigate to="/super/dashboard" replace />;
  }

  return children;
}

function AdminRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="vendors/:id" element={<VendorDetailPage />} />
          <Route path="kyc" element={<KycPage />} />
          <Route path="kyc/:id" element={<KycPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<PlaceholderPage title="Booking Detail" />} />
          <Route path="memberships" element={<PlaceholderPage title="Memberships" />} />
          <Route path="memberships/:id" element={<PlaceholderPage title="Membership Detail" />} />
          <Route path="payouts" element={<PlaceholderPage title="Payouts" />} />
          <Route path="payouts/:id" element={<PlaceholderPage title="Payout Detail" />} />
          <Route path="offers" element={<PlaceholderPage title="Offers & Promotions" />} />
          <Route path="offers/:id" element={<PlaceholderPage title="Offer Detail" />} />
          <Route path="products" element={<PlaceholderPage title="Products Overview" />} />
          <Route path="coaches" element={<PlaceholderPage title="Coaches Overview" />} />
          <Route path="tickets" element={<PlaceholderPage title="Support Tickets" />} />
          <Route path="tickets/:id" element={<PlaceholderPage title="Ticket Detail" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
          <Route path="search" element={<PlaceholderPage title="Search" />} />
          <Route path="settings" element={<SettingsPage />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="appearance" element={<AppearancePage />} />
            <Route path="notifications" element={<PlaceholderPage title="Notification Settings" />} />
            <Route path="password" element={<PlaceholderPage title="Change Password" />} />
            <Route path="commissions" element={<CommissionsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

function SuperAdminRoutes() {
  return (
    <SuperAuthProvider>
      <Routes>
        <Route
          path="login"
          element={
            <SuperPublicRoute>
              <SuperLoginPage />
            </SuperPublicRoute>
          }
        />
        <Route
          element={
            <SuperProtectedRoute>
              <SuperLayout />
            </SuperProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperDashboardPage />} />
          <Route path="admins" element={<AdminManagementPage />} />
          <Route path="config" element={<SystemConfigPage />} />
          <Route path="commissions" element={<SuperCommissionsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="vendors" element={<VendorOversightPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="broadcast" element={<BroadcastPage />} />
        </Route>
      </Routes>
    </SuperAuthProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/super/*" element={<SuperAdminRoutes />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
