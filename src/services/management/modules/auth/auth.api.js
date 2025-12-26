/**
 * Authentication API Module
 * Handles login, logout, token refresh, and user management
 * Backend 2 (Management) - /auth endpoints
 */

import managementClient from '../../config';

export const authApi = {
  /**
   * Login user
   * @param {Object} credentials - { username, password }
   * @returns {Promise} - { success, data: { token, user }, message }
   */
  login: async (credentials) => {
    console.log('🔐 Attempting login...', { username: credentials.username });

    // Log old token before clearing
    const oldToken = localStorage.getItem('authToken');
    console.log('🗑️ Old token (first 30):', oldToken?.substring(0, 30) || 'No old token');

    // Clear ALL old tokens before login
    localStorage.clear();
    console.log('🧹 Cleared all localStorage before login');

    const response = await managementClient.post('/auth/login', credentials);

    console.log('📥 Login response:', response);
    console.log('📥 Response.data:', response.data);
    console.log('📥 Response.data.token:', response.data?.token?.substring(0, 30));
    console.log('📥 Response.data.user:', response.data?.user);

    // Store token and user data
    if (response.data?.token) {
      console.log('💾 Storing NEW token and user data (response.data.token)');
      console.log('👤 User to store:', response.data.user);
      console.log('👤 User ID:', response.data.user?.id);
      
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('token', response.data.token); // Store in both keys
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      console.log('✅ NEW Token stored (first 30):', response.data.token.substring(0, 30));
      console.log('✅ Verify stored token:', localStorage.getItem('authToken')?.substring(0, 30));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('loginSuccess'));
      console.log('📢 loginSuccess event dispatched');
    } else if (response.token) {
      // Handle case where token is at root level
      console.log('💾 Storing NEW token and user data (response.token - root level)');
      console.log('👤 User to store:', response.user || response.data?.user);
      
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('token', response.token); // Store in both keys
      localStorage.setItem('user', JSON.stringify(response.user || response.data?.user));
      
      console.log('✅ NEW Token stored (first 30):', response.token.substring(0, 30));
      console.log('✅ Verify stored token:', localStorage.getItem('authToken')?.substring(0, 30));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('loginSuccess'));
      console.log('📢 loginSuccess event dispatched');
    } else {
      console.warn('⚠️ No token found in response');
      console.warn('⚠️ Full response structure:', JSON.stringify(response, null, 2));
    }

    return response;
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logout: async () => {
    try {
      await managementClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear ALL tokens and user data
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.clear(); // Clear everything to be safe
      console.log('🧹 All auth data cleared');
    }
  },

  /**
   * Refresh authentication token
   * @param {string} refreshToken
   * @returns {Promise}
   */
  refreshToken: async (refreshToken) => {
    const response = await managementClient.post('/auth/refresh', { refreshToken });

    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
    }

    return response;
  },

  /**
   * Get current user info
   * @returns {Object|null}
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Get current auth token
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

export default authApi;
