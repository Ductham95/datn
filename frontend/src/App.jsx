import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import UserLayout from '@/layouts/UserLayout/UserLayout';
import AdminLayout from '@/layouts/AdminLayout/AdminLayout';
import ProtectedRoute from '@/router/ProtectedRoute';
import { PageLoader } from '@/components/ui/Spinner/Spinner';

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('@/pages/user/Dashboard/Dashboard'));
const MapView = lazy(() => import('@/pages/user/MapView/MapView'));
const StationDetail = lazy(() => import('@/pages/user/StationDetail/StationDetail'));
const Ranking = lazy(() => import('@/pages/user/Ranking/Ranking'));
const History = lazy(() => import('@/pages/user/History/History'));
const NotFound = lazy(() => import('@/pages/user/NotFound/NotFound'));
const Login = lazy(() => import('@/pages/admin/Login/Login'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard/AdminDashboard'));
const Gateways = lazy(() => import('@/pages/admin/Gateways/Gateways'));
const SensorNodes = lazy(() => import('@/pages/admin/SensorNodes/SensorNodes'));
const Alerts = lazy(() => import('@/pages/admin/Alerts/Alerts'));
const Config = lazy(() => import('@/pages/admin/Config/Config'));
const Users = lazy(() => import('@/pages/admin/Users/Users'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs/AuditLogs'));
const Export = lazy(() => import('@/pages/admin/Export/Export'));
const TelemetryLogs = lazy(() => import('@/pages/admin/TelemetryLogs/TelemetryLogs'));
const Simulator = lazy(() => import('@/pages/admin/Simulator/Simulator'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* === User Routes === */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/station/:id" element={<StationDetail />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/history" element={<History />} />
          </Route>

          {/* === Admin Routes === */}
          <Route path="/admin/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/gateways" element={<Gateways />} />
              <Route path="/admin/nodes" element={<SensorNodes />} />
              <Route path="/admin/alerts" element={<Alerts />} />
              <Route path="/admin/config" element={<Config />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/logs" element={<AuditLogs />} />
              <Route path="/admin/export" element={<Export />} />
              <Route path="/admin/telemetry-logs" element={<TelemetryLogs />} />
              <Route path="/admin/simulator" element={<Simulator />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'var(--font-family)',
            fontSize: '14px',
            borderRadius: '10px',
            padding: '12px 16px',
          },
          success: {
            style: { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' },
          },
          error: {
            style: { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
          },
        }}
      />
    </BrowserRouter>
  );
}
