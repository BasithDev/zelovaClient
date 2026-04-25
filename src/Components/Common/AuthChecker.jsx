// src/Components/AuthChecker.js
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, setInitialized } from '../../Redux/slices/user/authUserSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { refreshAccessToken } from '../../Services/api';

/**
 * AuthChecker handles user authentication state on page load/refresh.
 * 
 * Key behaviors:
 * 1. On page load/refresh: Calls /auth/refresh to get new access token via HTTP-only cookie
 * 2. Skips entirely on public pages (login, register, etc.)
 * 3. Token is stored in memory (Redux) only - NOT in cookies/localStorage
 * 4. If refresh fails, redirects to login
 */
const AuthChecker = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Track if initial check has been done to prevent re-running
    const hasChecked = useRef(false);
    
    // Get current auth state from Redux
    const isAuthenticated = useSelector((state) => state.authUser.isAuthenticated);
    const isInitializing = useSelector((state) => state.authUser.isInitializing);

    useEffect(() => {
        // Skip if on admin routes - AdminAuthChecker handles those
        if (location.pathname.startsWith('/admin')) {
            if (isInitializing) {
                dispatch(setInitialized());
            }
            return;
        }

        // Public paths that don't need auth checking
        const publicPaths = ['/login', '/register', '/forgot-password', '/otp', '/google-response'];
        const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
        
        // Skip if on public page
        if (isPublicPath) {
            // Mark as initialized even on public pages
            if (isInitializing) {
                dispatch(setInitialized());
            }
            return;
        }

        // If already authenticated, just ensure initialized flag is set
        if (isAuthenticated) {
            if (isInitializing) {
                dispatch(setInitialized());
            }
            return;
        }

        // Only run the full check once per page load
        if (hasChecked.current) {
            // Ensure we're initialized even if check was already done
            if (isInitializing) {
                dispatch(setInitialized());
            }
            return;
        }
        hasChecked.current = true;

        // Attempt to refresh token using HTTP-only cookie
        const checkAuth = async () => {
            try {
                const accessToken = await refreshAccessToken();
                
                if (!accessToken) {
                    // No valid refresh token - redirect to login
                    console.log('[AuthChecker] No valid session, redirecting to login');
                    dispatch(setInitialized());
                    dispatch(logoutUser());
                    navigate('/login');
                }
                // If successful, accessToken is already stored in Redux by refreshAccessToken()
                // and setInitialized is called inside refreshAccessToken via setUserAuth
            } catch (error) {
                console.error('[AuthChecker] Auth check failed:', error);
                dispatch(setInitialized());
                dispatch(logoutUser());
                navigate('/login');
            }
        };

        checkAuth();
    }, [dispatch, navigate, location.pathname, isAuthenticated, isInitializing]);

    // Reset hasChecked when navigating to a different base path
    useEffect(() => {
        return () => {
            hasChecked.current = false;
        };
    }, []);

    return null;
};

export default AuthChecker;