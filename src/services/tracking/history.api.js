import { TRACKING_CONFIG } from './config';

/**
 * History & Analytics API Service
 * Base URL: TRACKING_CONFIG.BASE_URL + /history
 * NEW API endpoints for historical tracking with sensor snapshots
 */

/**
 * Build API URL with proper error handling
 */
const buildApiUrl = (endpoint) => {
  const baseUrl = TRACKING_CONFIG.BASE_URL;
  if (!baseUrl) {
    console.error('❌ TRACKING_CONFIG.BASE_URL is not configured');
    return '';
  }

  // Remove /api suffix from base URL if present and endpoint starts with /api
  let cleanBaseUrl = baseUrl;
  if (baseUrl.endsWith('/api') && endpoint.startsWith('/api')) {
    cleanBaseUrl = baseUrl.slice(0, -4);
  }

  return `${cleanBaseUrl}${endpoint}`;
};

/**
 * Fetch with timeout and retry logic
 */
const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = TRACKING_CONFIG.TIMEOUT } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

/**
 * Get truck history with sensor snapshots at each location
 * @param {number} truckId - Truck ID
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - ISO 8601 date string (optional)
 * @param {string} params.endDate - ISO 8601 date string (optional)
 * @param {number} params.limit - Max locations (default: 100)
 * @returns {Promise<Object>} Response with timeline data and metadata
 *
 * Response format:
 * {
 *   success: true,
 *   data: [
 *     {
 *       timestamp: "2025-12-18T07:31:12.097Z",
 *       location: { lat: -3.429668, lng: 115.559287 },
 *       tires: [
 *         {
 *           tireNo: 1,
 *           position: "Front Left Outer",
 *           temperature: 55.49,
 *           pressure: 92.08,
 *           status: "normal",
 *           battery: 99,
 *           timestamp: "2025-12-18T07:31:12.097Z"
 *         }
 *       ]
 *     }
 *   ],
 *   meta: {
 *     truckId: 1,
 *     truckPlate: "B 9001 SIM",
 *     totalLocations: 50,
 *     dateRange: { start: "...", end: "..." }
 *   }
 * }
 */
export const getTruckHistory = async (truckId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Use start_date and end_date (with underscores) as per documentation
    if (params.startDate || params.start_date) {
      queryParams.append('start_date', params.start_date || params.startDate);
    }
    if (params.endDate || params.end_date) {
      queryParams.append('end_date', params.end_date || params.endDate);
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    // Updated endpoint: /api/history/trucks/{id} (not /api/v1/history/trucks/{id})
    const endpoint = `/api/history/trucks/${truckId}${queryString ? `?${queryString}` : ''}`;
    const url = buildApiUrl(endpoint);

    console.log('🔍 Fetching truck history:', { truckId, params, url });

    const response = await fetchWithTimeout(url);

    console.log('✅ Truck history received:', {
      truckId,
      totalLocations: response?.meta?.totalLocations || 0,
      dateRange: response?.meta?.dateRange,
    });

    return response;
  } catch (error) {
    console.error('❌ Error fetching truck history:', error);
    throw error;
  }
};

/**
 * Get sensor statistics (avg, min, max) for a truck
 * @param {number} truckId - Truck ID
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - ISO 8601 date string (optional)
 * @param {string} params.endDate - ISO 8601 date string (optional)
 * @param {number} params.tireNo - Filter for specific tire (1-10) (optional)
 * @returns {Promise<Object>} Response with statistics
 *
 * Response format:
 * {
 *   success: true,
 *   data: {
 *     truck: { id: 1, plate: "B 9001 SIM" },
 *     period: { start: "...", end: "...", totalReadings: 288 },
 *     tires: [
 *       {
 *         tireNo: 1,
 *         position: "Front Left Outer",
 *         temperature: { avg: 58.34, min: 45.2, max: 72.5, unit: "°C" },
 *         pressure: { avg: 95.67, min: 88.3, max: 102.4, unit: "PSI" },
 *         alerts: { critical: 2, warning: 5 }
 *       }
 *     ]
 *   }
 * }
 */
export const getTruckStats = async (truckId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Use start_date and end_date (with underscores) as per documentation
    if (params.startDate || params.start_date) {
      queryParams.append('start_date', params.start_date || params.startDate);
    }
    if (params.endDate || params.end_date) {
      queryParams.append('end_date', params.end_date || params.endDate);
    }
    if (params.tireNo) {
      queryParams.append('tireNo', params.tireNo.toString());
    }

    const queryString = queryParams.toString();
    // Updated endpoint: /api/history/trucks/{id}/stats (not /api/v1/history/trucks/{id}/stats)
    const endpoint = `/api/history/trucks/${truckId}/stats${queryString ? `?${queryString}` : ''}`;
    const url = buildApiUrl(endpoint);

    console.log('📊 Fetching truck stats:', { truckId, params, url });

    const response = await fetchWithTimeout(url);

    console.log('✅ Truck stats received:', {
      truckId,
      totalReadings: response?.data?.period?.totalReadings || 0,
      tiresCount: response?.data?.tires?.length || 0,
    });

    return response;
  } catch (error) {
    console.error('❌ Error fetching truck stats:', error);
    throw error;
  }
};

export default {
  getTruckHistory,
  getTruckStats,
};
