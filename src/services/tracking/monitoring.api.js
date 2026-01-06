/**
 * Monitoring API Service
 * Handles Temperature and Tire Pressure Monitoring data
 * Uses live-tracking endpoint to get real-time sensor data
 */

import { TRACKING_CONFIG } from './config';

/**
 * Build API URL
 */
const buildApiUrl = (endpoint) => {
  const baseUrl = TRACKING_CONFIG.BASE_URL;
  if (!baseUrl) {
    console.error('❌ TRACKING_CONFIG.BASE_URL is not configured');
    return '';
  }

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
 * Get all temperature sensor data from all trucks
 * Uses live-tracking endpoint and extracts temperature-specific sensors
 *
 * @returns {Promise<Object>} Temperature monitoring data
 */
export const getTemperatureMonitoring = async () => {
  try {
    const url = buildApiUrl('/api/trucks/live-tracking');
    console.log('🌡️ Fetching temperature monitoring data from:', url);

    const response = await fetchWithTimeout(url);

    if (!response.success || !response.data?.trucks) {
      throw new Error('Invalid response format');
    }

    // Transform data to flat array of temperature sensors
    const temperatureData = [];

    response.data.trucks.forEach((truck) => {
      // Check if truck has sensors
      if (!truck.sensors || !Array.isArray(truck.sensors)) return;

      // Extract temperature sensors (assuming sensors with tempValue are temperature sensors)
      truck.sensors.forEach((sensor) => {
        temperatureData.push({
          id: `${truck.truck_id}-${sensor.id}`,
          truckId: truck.truck_id,
          truckCode: truck.plate_number || 'N/A',
          truckName: truck.truck_name || 'N/A',
          sensorId: sensor.sn || `SENSOR-${sensor.id}`,
          temperature: sensor.tempValue || 0,
          minTemp: 30, // Default thresholds - can be customized
          maxTemp: 85,
          status: sensor.exType || 'normal',
          battery: sensor.bat || 0,
          timestamp: sensor.updated_at || new Date().toISOString(),
        });
      });
    });

    console.log(
      `✅ Temperature data loaded: ${temperatureData.length} sensors from ${response.data.trucks.length} trucks`
    );

    return {
      success: true,
      data: temperatureData,
      summary: {
        total: temperatureData.length,
        trucks: response.data.trucks.length,
      },
      timestamp: response.timestamp,
    };
  } catch (error) {
    console.error('❌ Failed to fetch temperature monitoring data:', error);
    throw error;
  }
};

/**
 * Get all tire pressure sensor data from all trucks
 * Uses live-tracking endpoint and extracts tire pressure-specific data
 *
 * @returns {Promise<Object>} Tire pressure monitoring data
 */
export const getTirePressureMonitoring = async () => {
  try {
    const url = buildApiUrl('/api/trucks/live-tracking');
    console.log('🛞 Fetching tire pressure monitoring data from:', url);

    const response = await fetchWithTimeout(url);

    if (!response.success || !response.data?.trucks) {
      throw new Error('Invalid response format');
    }

    // Transform data to flat array of tire sensors
    const tireData = [];

    response.data.trucks.forEach((truck) => {
      // Check if truck has sensors
      if (!truck.sensors || !Array.isArray(truck.sensors)) return;

      // Extract tire sensors (all sensors have tire pressure data)
      truck.sensors.forEach((sensor) => {
        // ⚠️ Backend sends pressure in PSI (not kPa despite field name)
        const pressure = sensor.tirepValue || 0;
        const temperature = sensor.tempValue || 0;

        // Map exType to readable status
        let status = 'Normal';
        const exType = sensor.exType || '';

        // ✅ NEW THRESHOLDS (Dec 2025 Update)
        // Temperature: Normal 60-84°C, Warning ≥85°C, Critical ≥100°C
        // Pressure: Normal 100-119 PSI, Critical Low <90 PSI, Critical High ≥120 PSI

        if (exType.includes('4')) {
          status = 'Lost';
        } else if (exType.includes('5')) {
          status = 'Low Battery';
        } else if (exType.includes('1') || pressure >= 120) {
          status = 'High Pressure';
        } else if (exType.includes('2') || pressure < 90) {
          status = 'Low Pressure';
        } else if (exType.includes('3') || temperature >= 100) {
          status = 'High Temp';
        }

        tireData.push({
          id: `${truck.truck_id}-${sensor.id}`,
          truckId: truck.truck_id,
          truckCode: truck.plate_number || 'N/A',
          truckName: truck.truck_name || 'N/A',
          tireLocation: `Tire ${sensor.tireNo || sensor.sensorNo || 'N/A'}`,
          serialNumber: sensor.sn || `SENSOR-${sensor.id}`,
          pressure: pressure,
          temperature: temperature,
          battery: sensor.bat || 0,
          status: status,
          exType: exType,
          timestamp: sensor.updated_at || new Date().toISOString(),
        });
      });
    });

    console.log(
      `✅ Tire pressure data loaded: ${tireData.length} tires from ${response.data.trucks.length} trucks`
    );

    return {
      success: true,
      data: tireData,
      summary: {
        total: tireData.length,
        trucks: response.data.trucks.length,
      },
      timestamp: response.timestamp,
    };
  } catch (error) {
    console.error('❌ Failed to fetch tire pressure monitoring data:', error);
    throw error;
  }
};

/**
 * Get specific truck's sensor data
 *
 * @param {number} truckId - Truck ID
 * @returns {Promise<Object>} Truck sensor data
 */
export const getTruckSensors = async (truckId) => {
  try {
    if (!truckId) {
      throw new Error('Truck ID is required');
    }

    const url = buildApiUrl(`/api/trucks/${truckId}/tracking`);
    console.log('🔍 Fetching truck sensors from:', url);

    const response = await fetchWithTimeout(url);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch truck data');
    }

    return response;
  } catch (error) {
    console.error(`❌ Failed to fetch truck ${truckId} sensors:`, error);
    throw error;
  }
};

// Export all functions
export default {
  getTemperatureMonitoring,
  getTirePressureMonitoring,
  getTruckSensors,
};
