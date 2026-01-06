/**
 * Tracking API Service
 * Handles Live Tracking and History Tracking endpoints
 * Based on LIVE_TRACKING_FRONTEND_INTEGRATION.md
 */

import { TRACKING_CONFIG } from './config';

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
 * Fetch with timeout and error handling
 */
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRACKING_CONFIG.TIMEOUT);

  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Get all trucks with live location
 * Endpoint: GET /api/trucks/live-tracking
 *
 * @returns {Promise<Object>} Response with trucks array and summary
 *
 * Response structure:
 * {
 *   success: true,
 *   message: "Live tracking data retrieved successfully",
 *   data: {
 *     trucks: [
 *       {
 *         truck_id: 1,
 *         plate_number: "B 9001 SIM",
 *         truck_name: "Simulator Truck SIM01",
 *         model: "Mitsubishi Fuso",
 *         type: "Dump Truck",
 *         status: "active",
 *         driver: { id, name, phone },
 *         device: { id, serial_number, status, battery: {...} },
 *         location: { latitude, longitude, recorded_at, last_update },
 *         sensors: [...],
 *         sensor_summary: { total_sensors, normal_count, warning_count, critical_count }
 *       }
 *     ],
 *     summary: { total_trucks, trucks_with_location, trucks_without_location }
 *   },
 *   timestamp: "2025-12-15T07:43:45.000Z"
 * }
 */
export const getLiveTracking = async () => {
  try {
    const url = buildApiUrl('/api/trucks/live-tracking');
    console.log('🔄 Fetching live tracking data from:', url);

    const data = await fetchWithTimeout(url);

    if (data.success) {
      console.log(`✅ Live tracking data loaded: ${data.data?.trucks?.length || 0} trucks`);
    }

    return data;
  } catch (error) {
    console.error('❌ Failed to fetch live tracking:', error);
    throw error;
  }
};

/**
 * Get single truck tracking with history
 * Endpoint: GET /api/trucks/:id/tracking
 *
 * @param {number|string} truckId - Truck ID
 * @returns {Promise<Object>} Response with truck details and location history (all points)
 *
 * Response structure:
 * {
 *   success: true,
 *   message: "Truck tracking data retrieved successfully",
 *   data: {
 *     truck_id: 1,
 *     plate_number: "B 9001 SIM",
 *     truck_name: "Simulator Truck SIM01",
 *     model: "Mitsubishi Fuso",
 *     type: "Dump Truck",
 *     status: "active",
 *     driver: { id, name, phone },
 *     device: { id, serial_number, status },
 *     current_location: { latitude, longitude, recorded_at },
 *     location_history: [
 *       { latitude, longitude, recorded_at, created_at },
 *       ...
 *     ],
 *     sensors: [...]
 *   },
 *   timestamp: "2025-12-15T07:43:45.000Z"
 * }
 */
export const getTruckTracking = async (truckId) => {
  try {
    if (!truckId) {
      throw new Error('Truck ID is required');
    }

    // No limit - get all history points from backend
    const url = buildApiUrl(`/api/trucks/${truckId}/tracking`);
    console.log(`🔄 Fetching all tracking data for truck ${truckId} from:`, url);

    const data = await fetchWithTimeout(url);

    if (data.success) {
      const historyCount = data.data?.location_history?.length || 0;
      console.log(`✅ Truck ${truckId} tracking loaded: ${historyCount} history points (all data)`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch truck ${truckId} tracking:`, error);
    throw error;
  }
};

/**
 * Check backend connection status
 */
export const checkBackendStatus = async () => {
  try {
    const url = buildApiUrl('/api/trucks/live-tracking');
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// Export as tracking API service
export const trackingAPI = {
  getLiveTracking,
  getTruckTracking,
  checkBackendStatus,
};

export default trackingAPI;
