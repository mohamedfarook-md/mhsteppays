// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import './styles/global.css';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMerchants from './pages/admin/AdminMerchants';
import AdminAgents from './pages/admin/AdminAgents';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminQR from './pages/admin/AdminQR';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCommission from './pages/admin/AdminCommission';
import AdminLogs from './pages/admin/AdminLogs';
import AdminSettings from './pages/admin/AdminSettings';

// Agent Pages
import AgentLayout from './components/agent/AgentLayout';
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentMerchants from './pages/agent/AgentMerchants';
import AgentEarnings from './pages/agent/AgentEarnings';
import AgentNotifications from './pages/agent/AgentNotifications';

// Payment Pages
import PaymentPage from './pages/payment/PaymentPage';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailure from './pages/payment/PaymentFailure';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Root */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Auth */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="merchants" element={<AdminMerchants />} />
              <Route path="agents" element={<AdminAgents />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="qr" element={<AdminQR />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="commission" element={<AdminCommission />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Agent */}
            <Route path="/agent" element={<PrivateRoute role="agent"><AgentLayout /></PrivateRoute>}>
              <Route index element={<AgentDashboard />} />
              <Route path="merchants" element={<AgentMerchants />} />
              <Route path="earnings" element={<AgentEarnings />} />
              <Route path="notifications" element={<AgentNotifications />} />
            </Route>

            {/* Payment (public) */}
            <Route path="/pay/:merchantId" element={<PaymentPage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}