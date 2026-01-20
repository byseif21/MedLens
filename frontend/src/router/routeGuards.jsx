import { Navigate, Outlet } from 'react-router-dom';

const isAuthenticated = () => {
  const token = localStorage.getItem('auth_token');
  const userId = localStorage.getItem('user_id');
  return Boolean(token && userId);
};

const isAdmin = () => {
  const role = localStorage.getItem('user_role');
  return isAuthenticated() && role === 'admin';
};

export const PublicRoute = () => {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export const ProtectedRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = () => {
  return isAdmin() ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export const RootRedirect = () => {
  return <Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />;
};
