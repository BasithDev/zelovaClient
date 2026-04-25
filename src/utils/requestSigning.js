import CryptoJS from 'crypto-js';

/**
 * Request Signing Utility
 * 
 * Generates HMAC-SHA256 signatures for API requests
 * This makes API requests more secure by:
 * 1. Each request has a unique signature
 * 2. Signatures expire after 5 minutes
 * 3. Prevents replay attacks
 * 
 * Usage:
 *   import { signRequest, createSignedHeaders } from './requestSigning';
 *   
 *   // Option 1: Get individual values
 *   const { timestamp, signature } = signRequest('POST', '/api/user/profile', { name: 'John' });
 *   
 *   // Option 2: Get ready-to-use headers
 *   const headers = createSignedHeaders('GET', '/api/restaurants');
 *   axios.get('/api/restaurants', { headers });
 */

const APP_SECRET = import.meta.env.VITE_APP_SECRET;

/**
 * Generate SHA256 hash of data
 */
const sha256 = (data) => {
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
};

/**
 * Generate HMAC-SHA256 signature
 */
const hmacSha256 = (message, secret) => {
    return CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex);
};

/**
 * Sign a request
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API path (e.g., '/api/user/profile')
 * @param {object|null} body - Request body (for POST/PUT/PATCH)
 * @returns {{ timestamp: number, signature: string }}
 */
export const signRequest = (method, path, body = null) => {
    const timestamp = Date.now();
    
    // Hash the body if present
    const bodyHash = body && Object.keys(body).length > 0 
        ? sha256(JSON.stringify(body)) 
        : '';
    
    // Create message to sign: timestamp:method:path:bodyHash
    const message = `${timestamp}:${method.toUpperCase()}:${path}:${bodyHash}`;
    
    // Generate HMAC signature
    const signature = hmacSha256(message, APP_SECRET);
    
    return { timestamp, signature };
};

/**
 * Create headers object with signature
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {object|null} body - Request body
 * @returns {object} Headers object ready to use with axios
 */
export const createSignedHeaders = (method, path, body = null) => {
    const { timestamp, signature } = signRequest(method, path, body);
    
    return {
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature,
        'X-Requested-With': 'XMLHttpRequest'
    };
};

/**
 * Axios interceptor for automatic request signing
 * 
 * Usage:
 *   import axios from 'axios';
 *   import { addSigningInterceptor } from './requestSigning';
 *   
 *   addSigningInterceptor(axios);
 */
export const addSigningInterceptor = (axiosInstance) => {
    axiosInstance.interceptors.request.use((config) => {
        // Extract path from URL
        const url = new URL(config.url, window.location.origin);
        const path = url.pathname;
        
        // Generate signature
        const { timestamp, signature } = signRequest(
            config.method.toUpperCase(),
            path,
            config.data
        );
        
        // Add headers
        config.headers['X-Timestamp'] = timestamp.toString();
        config.headers['X-Signature'] = signature;
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        
        return config;
    });
};

export default {
    signRequest,
    createSignedHeaders,
    addSigningInterceptor
};
