import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth-provider';

export function RequireAdmin() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <h2 className="text-2xl font-bold text-destructive">Unauthorized Access</h2>
        <p className="text-muted-foreground">You do not have administrative privileges to view this page.</p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return <Outlet />;
}
