import axios from 'axios';
import CryptoJS from 'crypto-js';
import store from '../Redux/store';
import { setUserAuth, logoutUser, setInitialized } from '../Redux/slices/user/authUserSlice';
import { setAdminAuth, logoutAdmin, setAdminInitialized } from '../Redux/slices/admin/authAdminSlice';

const baseURL = import.meta.env.VITE_API_BASE_URL;

// Only used when request signing is enabled on server
const appSecret = import.meta.env.VITE_APP_SECRET;

/**
 * Generate HMAC-SHA256 signature for request
 * Only used when ENABLE_REQUEST_SIGNING=true on server
 */
const signRequest = (method, path, body, timestamp) => {
    if (!appSecret) return null;
    
    const bodyHash = body && Object.keys(body).length > 0 
        ? CryptoJS.SHA256(JSON.stringify(body)).toString(CryptoJS.enc.Hex)
        : '';
    
    const message = `${timestamp}:${method.toUpperCase()}:${path}:${bodyHash}`;
    return CryptoJS.HmacSHA256(message, appSecret).toString(CryptoJS.enc.Hex);
};

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true,  // Required for HTTP-only refresh token cookie
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let refreshSubscribers = [];

/**
 * Subscribe to token refresh completion
 */
const subscribeTokenRefresh = (callback) => {
    refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers with new access token
 */
const onRefreshed = (accessToken) => {
    refreshSubscribers.forEach(callback => callback(accessToken));
    refreshSubscribers = [];
};

/**
 * Notify all subscribers of refresh failure
 */
const onRefreshFailed = () => {
    refreshSubscribers.forEach(callback => callback(null));
    refreshSubscribers = [];
};

/**
 * Refresh the access token using HTTP-only refresh token cookie
 * @returns {Promise<string|null>} New access token or null if refresh failed
 */
export const refreshAccessToken = async () => {
    try {
        const response = await axios.post(`${baseURL}/auth/refresh`, {}, {
            withCredentials: true,  // Send HTTP-only cookie
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.data.status === 'Success') {
            const { userId, accessToken, isVendor, isAdmin, userStatus } = response.data;
            
            // Update the appropriate auth slice
            if (isAdmin) {
                store.dispatch(setAdminAuth({
                    adminId: userId,
                    accessToken: accessToken
                }));
            } else {
                store.dispatch(setUserAuth({
                    userId: userId,
                    accessToken: accessToken,
                    isVendor: isVendor,
                    status: userStatus
                }));
            }
            
            return accessToken;
        }
        return null;
    } catch (error) {
        console.warn('[API] Token refresh failed:', error.response?.data?.message || error.message);
        return null;
    }
};

/**
 * Initialize auth state on app load by checking refresh token
 * Call this once on app startup
 */
export const initializeAuth = async () => {
    try {
        const accessToken = await refreshAccessToken();
        if (!accessToken) {
            // No valid refresh token - user is not authenticated
            store.dispatch(setInitialized());
            store.dispatch(setAdminInitialized());
        }
    } catch (error) {
        console.warn('[API] Auth initialization failed:', error);
        store.dispatch(setInitialized());
        store.dispatch(setAdminInitialized());
    }
};

// Request interceptor - add auth token and optional request signature
api.interceptors.request.use(
    (config) => {
        // Only set Authorization if not already set (e.g., by retry after refresh)
        if (!config.headers.Authorization) {
            // Get access token from Redux store (in memory)
            const state = store.getState();
            const isAdminRoute = config.url?.includes('/admin');
            
            const token = isAdminRoute 
                ? state.authAdmin?.accessToken 
                : state.authUser?.accessToken || state.authAdmin?.accessToken;
            
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        
        // Add request signature (only if APP_SECRET is configured)
        if (appSecret) {
            const timestamp = Date.now();
            
            // Extract path from full URL
            let path = config.url;
            if (path.startsWith('http')) {
                const url = new URL(path);
                path = url.pathname;
            } else if (!path.startsWith('/')) {
                path = '/' + path;
            }
            
            // Remove query string for signature
            path = path.split('?')[0];
            
            // Prepend base path if needed
            if (!path.startsWith('/api')) {
                path = '/api' + path;
            }
            
            const signature = signRequest(
                config.method,
                path,
                config.data,
                timestamp
            );
            
            if (signature) {
                config.headers['X-Timestamp'] = timestamp.toString();
                config.headers['X-Signature'] = signature;
            }
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token expiry and auto-refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 - unauthorized (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't retry refresh endpoint itself
            if (originalRequest.url?.includes('/auth/refresh')) {
                return Promise.reject(error);
            }
            
            if (isRefreshing) {
                // If already refreshing, wait for the refresh to complete
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((accessToken) => {
                        if (accessToken) {
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                            resolve(api(originalRequest));
                        } else {
                            reject(error);
                        }
                    });
                });
            }
            
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                const newAccessToken = await refreshAccessToken();
                
                if (newAccessToken) {
                    onRefreshed(newAccessToken);
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } else {
                    // Refresh failed - log out user
                    onRefreshFailed();
                    store.dispatch(logoutUser());
                    store.dispatch(logoutAdmin());
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                onRefreshFailed();
                store.dispatch(logoutUser());
                store.dispatch(logoutAdmin());
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        // Handle 403 - forbidden
        if (error.response?.status === 403) {
            console.warn('Access forbidden:', error.response?.data?.message);
        }
        
        return Promise.reject(error);
    }
);

export default api;