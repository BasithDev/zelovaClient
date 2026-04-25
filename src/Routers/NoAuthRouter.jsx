// NoAuthRouter.js - Routes for unauthenticated users only
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';

/**
 * Admin route for unauthenticated access only
 * Redirects to admin dashboard if already logged in
 * Waits for auth initialization before making decisions
 */
export function AdminNoAuthRoute({ children }) {
  const isAdminAuthenticated = useSelector((state) => state.authAdmin.isAuthenticated);
  const isInitializing = useSelector((state) => state.authAdmin.isInitializing);

  // Wait for auth initialization to complete
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to admin dashboard if already authenticated
  if (isAdminAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return children ? children : <Outlet />;
}

AdminNoAuthRoute.propTypes = {
  children: PropTypes.node,
};

/**
 * User route for unauthenticated access only
 * Redirects to home (or role-select for vendors) if already logged in
 */
export function UserNoAuthRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.authUser.isAuthenticated);
  const isVendor = useSelector((state) => state.authUser.isVendor);
  const userToken = Cookies.get('user_token');
  const isVendorCookie = Cookies.get('is_vendor') === 'true';

  // Check both Redux and cookies
  const isLoggedIn = isAuthenticated || !!userToken;
  const hasVendorRole = isVendor || isVendorCookie;

  if (isLoggedIn) {
    // Vendors go to role selection, regular users go to home
    if (hasVendorRole) {
      return <Navigate to="/role-select" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}

UserNoAuthRoute.propTypes = {
  children: PropTypes.node,
};