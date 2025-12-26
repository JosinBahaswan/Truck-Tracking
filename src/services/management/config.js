/**
 * Backend 2 (BE2) Configuration - Management & Master Data
 * Base URL: VITE_API_BASE_URL
 * Handles: Dashboard, Fleet Management, Drivers, Vendors, Devices, Alerts, Settings
 * Semua master data & management kecuali tracking
 */

import axios from 'axios';

// Backend 2 Base URL - Master Data & Management
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || '';

// API Configuration object
export const MANAGEMENT_CONFIG = {
  BASE_URL: API_BASE_URL,
  WS_URL: WS_BASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000,
};

/**
 * Create axios instance for Backend 2 (Management)
 * Includes JWT token injection and global error handling
 */
const managementClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
managementClient.interceptors.request.use(
  (config) => {
    // ALWAYS read fresh token from localStorage (no caching!)
    // This ensures we get the latest token even after login/logout
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    console.log('🔑 [managementClient] Request interceptor - Token:', token?.substring(0, 30) + '...');
    console.log('📍 [managementClient] Request URL:', config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ [managementClient] No token found in localStorage!');
      // Remove Authorization header if no token
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
managementClient.interceptors.response.use(
  (response) => {
    console.log('✅ [managementClient] Response received:', {
      url: response.config?.url,
      status: response.status,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    
    // Return the data directly if success
    if (response.data?.success !== false) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('🔒 Unauthorized - redirecting to login');
      window.location.href = '/login';
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An error occurred';

    console.error('Management API Error:', {
      status: error.response?.status,
      message: errorMessage,
      url: error.config?.url,
    });

    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });
  }
);

export default managementClient;
