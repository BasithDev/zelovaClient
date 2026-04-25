// src/Components/AdminAuthChecker.js
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutAdmin, setAdminInitialized } from '../../Redux/slices/admin/authAdminSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import { refreshAccessToken } from '../../Services/api';

/**
 * AdminAuthChecker handles admin authentication state on page load/refresh.
 * 
 * Key behaviors:
 * 1. On page load/refresh: Calls /auth/refresh to get new access token via HTTP-only cookie
 * 2. Skips on admin login page
 * 3. Token is stored in memory (Redux) only
 * 4. If refresh fails, redirects to admin login
 */
const AdminAuthChecker = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    
    const hasChecked = useRef(false);
    const isAuthenticated = useSelector((state) => state.authAdmin.isAuthenticated);
    const isInitializing = useSelector((state) => state.authAdmin.isInitializing);

    useEffect(() => {
        // Only run for admin routes
        if (!location.pathname.startsWith('/admin')) {
            return;
        }
        
        // Skip if on admin login page
        if (location.pathname === '/admin/login') {
            if (isInitializing) {
                dispatch(setAdminInitialized());
            }
            return;
        }

        // Skip if already authenticated in Redux
        if (isAuthenticated) {
            return;
        }

        // Only run once per mount
        if (hasChecked.current) {
            return;
        }
        hasChecked.current = true;

        // Attempt to refresh token using HTTP-only cookie
        const checkAuth = async () => {
            try {
                const accessToken = await refreshAccessToken();
                
                if (!accessToken) {
                    // No valid refresh token - redirect to admin login
                    console.log('[AdminAuthChecker] No valid session, redirecting to admin login');
                    dispatch(logoutAdmin());
                    navigate('/admin/login');
                }
                // If successful, accessToken is already stored in Redux by refreshAccessToken()
            } catch (error) {
                console.error('[AdminAuthChecker] Auth check failed:', error);
                dispatch(logoutAdmin());
                navigate('/admin/login');
            }
        };

        checkAuth();
    }, [dispatch, navigate, location.pathname, isAuthenticated, isInitializing]);

    // Reset check when path changes
    useEffect(() => {
        hasChecked.current = false;
    }, [location.pathname]);

    return null;
};

export default AdminAuthChecker;