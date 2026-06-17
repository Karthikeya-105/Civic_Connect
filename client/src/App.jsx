import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';

// Lazy-load pages for performance
const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ReportIssue = React.lazy(() => import('./pages/ReportIssue'));
const MapView = React.lazy(() => import('./pages/MapView'));
const MyReports = React.lazy(() => import('./pages/MyReports'));
const IssueDetail = React.lazy(() => import('./pages/IssueDetail'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Awards = React.lazy(() => import('./pages/Awards'));
const SellPage = React.lazy(() => import('./pages/SellPage'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Donate = React.lazy(() => import('./pages/Donate'));
const CleanupDrives = React.lazy(() => import('./pages/CleanupDrives'));
const DeptAdminLogin = React.lazy(() => import('./pages/DeptAdminLogin'));
const DeptAdminDashboard = React.lazy(() => import('./pages/DeptAdminDashboard'));
const Vouchers = React.lazy(() => import('./pages/Vouchers'));

// Route guards
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const DeptAdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/dept-login" replace />;
  if (user.role !== 'dept_admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'dept_admin') return <Navigate to="/dept-admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
    <div className="spinner" />
    <span style={{ color: '#64748b', fontSize: 14 }}>Loading...</span>
  </div>
);

const AppInner = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/map" element={<MapView />} />
          <Route path="/issues/:id" element={<IssueDetail />} />

          {/* Protected - Citizen */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/report" element={<PrivateRoute><ReportIssue /></PrivateRoute>} />
          <Route path="/my-reports" element={<PrivateRoute><MyReports /></PrivateRoute>} />
          <Route path="/awards" element={<PrivateRoute><Awards /></PrivateRoute>} />
          <Route path="/sell/plastic" element={<PrivateRoute><SellPage type="plastic" /></PrivateRoute>} />
          <Route path="/sell/manure" element={<PrivateRoute><SellPage type="manure" /></PrivateRoute>} />
          <Route path="/sell/ewaste" element={<PrivateRoute><SellPage type="ewaste" /></PrivateRoute>} />
          <Route path="/vouchers" element={<PrivateRoute><Vouchers /></PrivateRoute>} />
          <Route path="/donate" element={<PrivateRoute><Donate /></PrivateRoute>} />
          <Route path="/cleanup-drives" element={<PrivateRoute><CleanupDrives /></PrivateRoute>} />

          {/* Protected - Admin */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />

          {/* Protected - Department Admin */}
          <Route path="/dept-login" element={<DeptAdminLogin />} />
          <Route path="/dept-admin" element={<DeptAdminRoute><DeptAdminDashboard /></DeptAdminRoute>} />

          {/* Profile segment */}
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Persistent chatbot */}
      {user && <Chatbot />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: 14, borderRadius: 10, maxWidth: 360 },
          success: { iconTheme: { primary: '#138808', secondary: 'white' } },
          error: { iconTheme: { primary: '#DC2626', secondary: 'white' } },
        }}
      />
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
