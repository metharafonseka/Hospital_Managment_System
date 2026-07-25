import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import type { Role } from '../api/types';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, hasRole } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />;

  return <Outlet />;
}
