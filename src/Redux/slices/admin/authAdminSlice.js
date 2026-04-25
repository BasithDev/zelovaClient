import { createSlice } from '@reduxjs/toolkit';

/**
 * Admin auth state - stored in memory only for XSS protection
 * Refresh token is stored as HTTP-only cookie (invisible to JS)
 */

const getInitialState = () => ({
  adminId: null,
  accessToken: null,  // Memory only - NOT in cookies
  isAuthenticated: false,
  isInitializing: true,
});

const authAdminSlice = createSlice({
  name: 'authAdmin',
  initialState: getInitialState(),
  reducers: {
    setAdminAuth(state, action) {
      const { adminId, accessToken } = action.payload;
      state.adminId = adminId;
      state.accessToken = accessToken;  // Memory only!
      state.isAuthenticated = true;
      state.isInitializing = false;
    },
    logoutAdmin(state) {
      state.adminId = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
    },
    setAdminInitialized(state) {
      state.isInitializing = false;
    }
  },
});

export const { setAdminAuth, logoutAdmin, setAdminInitialized } = authAdminSlice.actions;
export default authAdminSlice.reducer;