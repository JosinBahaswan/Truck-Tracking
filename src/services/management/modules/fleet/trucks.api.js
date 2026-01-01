/**
 * Trucks API for Backend 2
 * Handles all truck management operations (CRUD)
 */

import api2Instance from '../../config';

export const trucksApi = {
  /**
   * Get all trucks with pagination and filters
   * @param {Object} params - { page, limit, status, vendor_id, search, includeDeleted }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.vendor_id) queryParams.append('vendor_id', params.vendor_id);
      if (params.search) queryParams.append('search', params.search);
      if (params.includeDeleted) queryParams.append('includeDeleted', 'true'); // 🔥 Support deleted trucks

      const queryString = queryParams.toString();
      const url = queryString ? `/trucks?${queryString}` : '/trucks';

      console.log('🚛 Fetching trucks from:', url);
      const response = await api2Instance.get(url);
      
      // Debug: log raw response structure
      console.log('🔍 Raw response structure:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        hasSuccess: response?.success,
        dataTrucks: response?.data?.trucks?.length,
        directTrucks: response?.trucks?.length,
        responseKeys: response ? Object.keys(response) : [],
        dataKeys: response?.data ? Object.keys(response?.data) : []
      });
      
      console.log(
        '✅ Trucks data loaded:',
        response?.data?.trucks?.length || response?.trucks?.length || response?.data?.length || 'unknown count',
        'trucks'
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to load trucks:', error.message);
      throw error;
    }
  },

  /**
   * Get truck summary statistics
   * @returns {Promise}
   */
  getSummary: async () => {
    const response = await api2Instance.get('/trucks/summary');
    return response;
  },

  /**
   * Get trucks by status
   * @param {string} status - 'active', 'maintenance', 'inactive'
   * @returns {Promise}
   */
  getByStatus: async (status) => {
    const response = await api2Instance.get(`/trucks/by-status?status=${status}`);
    return response;
  },

  /**
   * Get specific truck by ID
   * @param {string} truckId
   * @returns {Promise}
   */
  getById: async (truckId) => {
    const response = await api2Instance.get(`/trucks/${truckId}`);
    return response;
  },

  /**
   * Get truck tire pressures
   * @param {string} truckId
   * @returns {Promise}
   */
  getTirePressures: async (truckId) => {
    const response = await api2Instance.get(`/trucks/${truckId}/tires`);
    return response;
  },

  /**
   * Get truck location history
   * @param {string} truckId - Truck ID
   * @param {Object} params - { startDate, endDate, limit }
   * @returns {Promise}
   */
  getLocationHistory: async (truckId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/trucks/${truckId}/history?${queryString}`
      : `/trucks/${truckId}/history`;
    const response = await api2Instance.get(url);
    return response;
  },

  /**
   * Get truck locations by name
   * @param {string} truckName - Truck name
   * @returns {Promise}
   */
  getLocationsByName: async (truckName) => {
    const response = await api2Instance.get(`/trucks/${encodeURIComponent(truckName)}/locations`);
    return response;
  },

  /**
   * Get truck alerts
   * @param {string} truckId
   * @param {Object} params - { status, severity }
   * @returns {Promise}
   */
  getAlerts: async (truckId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.append('status', params.status);
    if (params.severity) queryParams.append('severity', params.severity);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/trucks/${truckId}/alerts?${queryString}`
      : `/trucks/${truckId}/alerts`;
    const response = await api2Instance.get(url);
    return response;
  },

  /**
   * Get real-time truck locations (GeoJSON)
   * @returns {Promise}
   */
  getRealtimeLocations: async () => {
    const response = await api2Instance.get('/trucks/realtime/locations');
    return response;
  },

  /**
   * Create new truck (with optional image upload)
   * @param {Object|FormData} truckData - FormData for image upload or Object { name, plate, vin, model, type, year, status, vendor_id, driver_id, image }
   * @returns {Promise}
   */
  create: async (truckData) => {
    const config =
      truckData instanceof FormData
        ? {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        : {};
    const response = await api2Instance.post('/trucks', truckData, config);
    return response;
  },

  /**
   * Update truck (with optional image upload)
   * @param {string} truckId
   * @param {Object|FormData} truckData - FormData for image upload or Object
   * @returns {Promise}
   */
  update: async (truckId, truckData) => {
    const config =
      truckData instanceof FormData
        ? {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        : {};
    const response = await api2Instance.put(`/trucks/${truckId}`, truckData, config);
    return response;
  },

  /**
   * Update truck status
   * @param {string} truckId
   * @param {string} status - 'active', 'inactive', 'maintenance'
   * @returns {Promise}
   */
  updateStatus: async (truckId, status) => {
    const response = await api2Instance.put(`/trucks/${truckId}/status`, { status });
    return response;
  },

  /**
   * Delete truck
   * @param {string} truckId
   * @returns {Promise}
   */
  delete: async (truckId) => {
    const response = await api2Instance.delete(`/trucks/${truckId}`);
    return response;
  },

  /**
   * Resolve truck alert
   * @param {string} truckId
   * @param {string} alertId
   * @returns {Promise}
   */
  resolveAlert: async (truckId, alertId) => {
    const response = await api2Instance.put(`/trucks/${truckId}/alerts/${alertId}/resolve`);
    return response;
  },
};

export default trucksApi;
