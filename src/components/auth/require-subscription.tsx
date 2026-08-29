import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-provider';

export function RequireSubscription() {
  const { user, hasActiveSubscription, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasActiveSubscription) {
    return <Navigate to="/pricing" state={{ from: location, message: "This feature requires an active subscription." }} replace />;
  }

  return <Outlet />;
}
