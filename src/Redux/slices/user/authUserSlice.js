import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

/**
 * Auth state is now stored primarily in memory (Redux).
 * - accessToken: Stored in memory only (NOT in cookies/localStorage) for XSS protection
 * - isVendor: Can be persisted in cookie for page refresh convenience
 * - The actual session is maintained via HTTP-only refresh token cookie (invisible to JS)
 */

const getInitialState = () => {
  // We can still use is_vendor cookie for convenience, but NOT the token
  const isVendor = Cookies.get('is_vendor') === 'true';
  
  return {
    userId: null,
    accessToken: null,  // Stored in memory only - NOT in cookies!
    isAuthenticated: false,  // Will be set to true after refresh token check
    isVendor: isVendor,
    status: null,
    role: isVendor ? 'vendor' : 'user',
    isInitializing: true,  // True until we've checked refresh token
  };
};

const authUserSlice = createSlice({
  name: 'authUser',
  initialState: getInitialState(),
  reducers: {
    /**
     * Set user authentication state
     * Called on:
     * 1. Successful login response
     * 2. Successful token refresh
     * 3. Google OAuth callback
     */
    setUserAuth(state, action) {
      const { userId, accessToken, isVendor = false, status = 'active' } = action.payload;
      
      state.userId = userId;
      state.accessToken = accessToken;  // Memory only!
      state.isAuthenticated = true;
      state.isVendor = isVendor;
      state.status = status;
      state.role = isVendor ? 'vendor' : 'user';
      state.isInitializing = false;
      
      // Keep is_vendor cookie for page refresh convenience
      Cookies.set('is_vendor', isVendor.toString(), { 
        expires: 7, // 7 days (matches refresh token)
        sameSite: 'Lax'
      });
    },
    
    /**
     * Clear all user authentication state
     * Note: Refresh token cookie is cleared by backend on logout
     */
    logoutUser(state) {
      state.userId = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isVendor = false;
      state.status = null;
      state.role = 'user';
      state.isInitializing = false;
      
      Cookies.remove('is_vendor');
    },
    
    /**
     * Mark initialization as complete (refresh check done)
     */
    setInitialized(state) {
      state.isInitializing = false;
    },
    
    /**
     * Update just the vendor status (for role switching)
     */
    setVendorStatus(state, action) {
      state.isVendor = action.payload;
      state.role = action.payload ? 'vendor' : 'user';
      Cookies.set('is_vendor', action.payload.toString(), { 
        expires: 7,
        sameSite: 'Lax'
      });
    }
  },
});

export const { setUserAuth, logoutUser, setVendorStatus, setInitialized } = authUserSlice.actions;
export default authUserSlice.reducer;