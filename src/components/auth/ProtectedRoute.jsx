import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const ProtectedRoute = ({ allowedRoles }) => {
  const { session, profile, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to their respective dashboard if they try to access unauthorized routes
    if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (profile.role === 'tutor') return <Navigate to="/tutor/dashboard" replace />;
    if (profile.role === 'guardian') return <Navigate to="/guardian/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
