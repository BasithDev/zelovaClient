import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { setUserAuth } from '../Redux/slices/user/authUserSlice';

/**
 * GoogleResponse handles the OAuth callback from Google authentication.
 * 
 * After Google OAuth:
 * - Backend sets refresh token as HTTP-only cookie
 * - Backend redirects here with accessToken, userId, isVendor as URL params
 * - We store accessToken in memory (Redux) and navigate to home
 */
const GoogleResponse = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [status, setStatus] = useState(null);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const statusFromQuery = query.get('status');
        const accessToken = query.get('accessToken');
        const userId = query.get('userId');
        const isVendor = query.get('isVendor') === 'true';

        setStatus(statusFromQuery);

        // Handle blocked status
        if (statusFromQuery === 'blocked') {
            return;
        }

        // Handle error status
        if (statusFromQuery === 'error') {
            toast.error("An error occurred during login. Please try again.");
            return;
        }

        // If we have a valid access token, store it and redirect
        if (accessToken && userId) {
            // Store access token in memory only (Redux state)
            dispatch(setUserAuth({
                userId,
                accessToken,  // Memory only
                isVendor,
                status: 'active'
            }));

            // Clear URL params for security (don't leave token in browser history)
            window.history.replaceState({}, document.title, window.location.pathname);

            // Navigate to appropriate page
            if (isVendor) {
                navigate('/role-select', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [dispatch, navigate]);

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
            {status === 'blocked' ? (
                <div className="w-full max-w-md p-4 sm:p-6 bg-white border border-red-500 rounded-md shadow-lg text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-3 sm:mb-4">Account Blocked</h2>
                    <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                        Your account is blocked. Please contact support for further assistance.
                    </p>
                    <button
                        onClick={handleLoginRedirect}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm sm:text-base"
                    >
                        Go to Login
                    </button>
                </div>
            ) : status === 'error' ? (
                <div className="w-full max-w-md p-4 sm:p-6 bg-white border border-yellow-500 rounded-md shadow-lg text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-yellow-600 mb-3 sm:mb-4">Error Occurred</h2>
                    <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                        There was an error during login. Please try again later.
                    </p>
                    <button
                        onClick={handleLoginRedirect}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm sm:text-base"
                    >
                        Go to Login
                    </button>
                </div>
            ) : (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-base sm:text-lg text-gray-700">Processing your login...</p>
                </div>
            )}
        </div>
    );
};

export default GoogleResponse;