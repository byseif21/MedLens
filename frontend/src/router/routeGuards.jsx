import { Navigate, Outlet } from 'react-router-dom';

const isAuthenticated = () => {
  const token = localStorage.getItem('auth_token');
  const userId = localStorage.getItem('user_id');
  return Boolean(token && userId);
};

export const PublicRoute = () => {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export const ProtectedRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export const RootRedirect = () => {
  return <Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />;
};
