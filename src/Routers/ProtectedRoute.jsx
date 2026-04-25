// ProtectedRoute.js
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

/**
 * User protected route - requires authenticated user
 * Waits for auth initialization before making redirect decisions
 */
export function UserProtectedRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.authUser.isAuthenticated);
  const userStatus = useSelector((state) => state.authUser.status);
  const isInitializing = useSelector((state) => state.authUser.isInitializing);

  // Wait for auth initialization to complete before redirecting
  // This prevents redirecting to login before AuthChecker has called refreshAccessToken
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Block if user is blocked
  if (userStatus === 'blocked') {
    return <Navigate to="/login" replace />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}

UserProtectedRoute.propTypes = {
  children: PropTypes.node,
};

/**
 * User role protected route - requires specific role(s)
 * Used for vendor-only pages
 */
export function UserRoleProtectedRoute({ allowedRoles }) {
  const isAuthenticated = useSelector((state) => state.authUser.isAuthenticated);
  const isVendor = useSelector((state) => state.authUser.isVendor);
  const userStatus = useSelector((state) => state.authUser.status);
  const isInitializing = useSelector((state) => state.authUser.isInitializing);

  const userRole = isVendor ? 'vendor' : 'user';

  // Wait for auth initialization to complete before redirecting
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Block if user is blocked
  if (userStatus === 'blocked') {
    return <Navigate to="/login" replace />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  // Wrong role - redirect to home
  return <Navigate to="/" replace />;
}

UserRoleProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

/**
 * Admin role protected route - requires admin authentication
 * Waits for auth initialization before making redirect decisions
 */
export function AdminRoleProtectedRoute() {
  const isAdminAuthenticated = useSelector((state) => state.authAdmin.isAuthenticated);
  const isInitializing = useSelector((state) => state.authAdmin.isInitializing);

  // Wait for auth initialization to complete before redirecting
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}