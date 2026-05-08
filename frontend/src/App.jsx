import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage   from './pages/LandingPage';
import TestEngine    from './pages/TestEngine';
import LoginPage     from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AuthSelectPage from './pages/AuthSelectPage';
import SignupPage    from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage     from './pages/AdminPage';
import MeshBackground from './components/MeshBackground';
import FloatingNav    from './components/FloatingNav';
import { PageTransition } from './components/PageTransition';
import { ThemeProvider }  from './context/ThemeContext';

// ── Role-based route guard ─────────────────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole }) => {
  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('user')); } catch { /* noop */ }

  // Not logged in at all → go to selection screen
  if (!currentUser?.token) return <Navigate to="/auth-select" replace />;

  // Role mismatch: admin trying to access /dashboard → push to /admin
  if (requiredRole === 'user' && currentUser.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Role mismatch: non-admin trying to access /admin → push to /dashboard
  if (requiredRole === 'admin' && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ── Animated routes keyed by pathname ─────────────────────────────────────
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          {/* Public routes */}
          <Route path="/"             element={<LandingPage />} />
          <Route path="/auth-select"  element={<AuthSelectPage />} />
          <Route path="/login"        element={<LoginPage   />} />
          <Route path="/admin-login"  element={<AdminLoginPage />} />
          <Route path="/signup"       element={<SignupPage  />} />

          {/* User-only routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="user">
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/test/:testId" element={
            <ProtectedRoute requiredRole={null}>
              <TestEngine />
            </ProtectedRoute>
          } />

          {/* Admin-only routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
};

// ── Root layout ────────────────────────────────────────────────────────────
const AppLayout = () => {
  const location = useLocation();
  const isTest  = location.pathname.startsWith('/test/');
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-sm-bg text-slate-100 relative">
      {/* Global background layers */}
      <MeshBackground />

      {/* FloatingNav — hidden on test pages and admin dashboard */}
      {!isTest && !isAdmin && <FloatingNav />}

      {/* Page content */}
      <div className="relative z-10">
        <AnimatedRoutes />
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppLayout />
      </Router>
    </ThemeProvider>
  );
}

export default App;