import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import StudentDashboard from '../pages/student/StudentDashboard';
import StaffDashboard from '../pages/clinician/StaffDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import {
  clearSession,
  getDashboardPath,
  getStoredUser,
  getToken,
  normalizeRole,
} from '../lib/utils/session';

import '../styles/app.css';

function PublicOnlyRoute({ children }) {
  const user = getStoredUser();
  const dashboardPath = getDashboardPath(user?.role);

  if (user && getToken(user) && dashboardPath !== '/login') {
    return <Navigate to={dashboardPath} replace />;
  }

  if (user && getToken(user)) {
    clearSession();
  }

  return children;
}

function ProtectedRoute({ allowedRoles, children }) {
  const user = getStoredUser();

  if (!user || !getToken(user)) return <Navigate to="/login" replace />;

  const userRole = normalizeRole(user.role);
  const acceptedRoles = allowedRoles.map(normalizeRole);

  if (!acceptedRoles.includes(userRole)) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  return children;
}

function DashboardRedirect() {
  const user = getStoredUser();

  if (!user || !getToken(user)) return <Navigate to="/login" replace />;

  return <Navigate to={getDashboardPath(user.role)} replace />;
}

function NotFoundPage() {
  return (
    <main className="pulse-not-found">
      <section className="pulse-not-found-card">
        <p>404</p>
        <h1>Page not found</h1>
        <span>The page you requested does not exist.</span>
        <a href="/">Return to home</a>
      </section>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['STAFF']}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/student/*" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/staff/*" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
