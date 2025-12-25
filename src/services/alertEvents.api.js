/**
 * Alert Events API Service
 * Based on ALERT_EVENTS_API.md documentation
 * Backend URL: Uses VITE_ALERTS_API_BASE_URL from .env
 */

const BASE_URL = import.meta.env.VITE_ALERTS_API_BASE_URL || '/alerts-api/api';
const TESTING_MODE = true; // Set to false in production

/**
 * Helper function for fetch with timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Build query string from params object
 */
const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

/**
 * Alert Events API
 */
export const alertEventsAPI = {
  /**
   * Get all alerts with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {string} params.severity - Filter by severity: 'critical', 'warning', 'info'
   * @param {string} params.status - Filter by status: 'active', 'resolved'
   * @param {number} params.truck_id - Filter by truck ID
   * @param {number} params.device_id - Filter by device ID
   * @param {number} params.sensor_id - Filter by sensor ID
   * @param {string} params.date - Filter specific day (YYYY-MM-DD)
   * @param {string} params.date_from - Start date range (YYYY-MM-DD)
   * @param {string} params.date_to - End date range (YYYY-MM-DD)
   * @param {string} params.sortBy - Sort by field (default: 'created_at')
   * @param {string} params.sortOrder - Sort order: 'asc', 'desc' (default: 'desc')
   * @returns {Promise<Object>} { success, data, pagination }
   */
  getAlerts: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = `${BASE_URL}/alerts${queryString ? `?${queryString}` : ''}`;

    console.log('🔄 Fetching alerts:', url);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (!TESTING_MODE) {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const data = await fetchWithTimeout(url, { headers });
      console.log('✅ Alerts fetched successfully:', data.pagination);
      return data;
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
      throw error;
    }
  },

  /**
   * Get active alerts only
   * @param {Object} params - Query parameters
   * @param {string} params.severity - Filter by severity
   * @param {number} params.truck_id - Filter by truck ID
   * @returns {Promise<Object>} { success, data, count }
   */
  getActiveAlerts: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = `${BASE_URL}/alerts/active${queryString ? `?${queryString}` : ''}`;

    console.log('🔄 Fetching active alerts:', url);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (!TESTING_MODE) {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const data = await fetchWithTimeout(url, { headers }, 10000); // 10s timeout
      console.log('✅ Active alerts fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching active alerts:', error.message);
      // Return empty result instead of throwing to prevent polling from stopping
      return {
        success: false,
        data: [],
        count: 0,
        error: error.message
      };
    }
  },

  /**
   * Get alert statistics
   * @param {number} days - Period in days (default: 7)
   * @param {number} truckId - Optional truck ID filter
   * @returns {Promise<Object>} { success, data: { summary, byType, period } }
   */
  getAlertStats: async (days = 7, truckId = null) => {
    const params = { days };
    if (truckId) params.truck_id = truckId;

    const queryString = buildQueryString(params);
    const url = `${BASE_URL}/alerts/stats${queryString ? `?${queryString}` : ''}`;

    console.log('🔄 Fetching alert stats:', url);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (!TESTING_MODE) {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const data = await fetchWithTimeout(url, { headers });
      console.log('✅ Alert stats fetched:', data.data?.summary);
      return data;
    } catch (error) {
      console.error('❌ Error fetching alert stats:', error);
      throw error;
    }
  },

  /**
   * Get single alert by ID
   * @param {number} id - Alert ID
   * @returns {Promise<Object>} { success, data }
   */
  getAlertById: async (id) => {
    const url = `${BASE_URL}/alerts/${id}`;

    console.log('🔄 Fetching alert by ID:', id);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (!TESTING_MODE) {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const data = await fetchWithTimeout(url, { headers });
      console.log('✅ Alert fetched:', data.data?.id);
      return data;
    } catch (error) {
      console.error('❌ Error fetching alert:', error);
      throw error;
    }
  },

  /**
   * Resolve alert
   * @param {number} id - Alert ID
   * @returns {Promise<Object>} { success, message, data }
   */
  resolveAlert: async (id) => {
    const url = `${BASE_URL}/alerts/${id}/resolve`;

    console.log('🔄 Resolving alert:', id);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (!TESTING_MODE) {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const data = await fetchWithTimeout(url, {
        method: 'PATCH',
        headers,
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('✅ Alert resolved:', data.data?.id);
      return data;
    } catch (error) {
      console.error('❌ Error resolving alert:', error);
      throw error;
    }
  },

  /**
   * Delete alert
   * @param {number} id - Alert ID
   * @returns {Promise<Object>} { success, message }
   */
  deleteAlert: async (id) => {
    const url = `${BASE_URL}/alerts/${id}`;

    console.log('🔄 Deleting alert:', id);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (!TESTING_MODE) {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const data = await fetchWithTimeout(url, {
        method: 'DELETE',
        headers,
      });

      console.log('✅ Alert deleted:', id);
      return data;
    } catch (error) {
      console.error('❌ Error deleting alert:', error);
      throw error;
    }
  },
};

export default alertEventsAPI;
