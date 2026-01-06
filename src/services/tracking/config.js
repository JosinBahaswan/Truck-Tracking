/**
 * Backend 1 (BE1) Configuration - Tracking & TPMS
 * Handles: Live Tracking, History Tracking, TPMS, Telemetry
 * Base URL: VITE_TRACKING_API_BASE_URL
 */

// Tracking API Configuration (Backend 1)
export const TRACKING_CONFIG = {
  BASE_URL: import.meta.env.VITE_TRACKING_API_BASE_URL || '',
  WS_URL: import.meta.env.VITE_TRACKING_WS_URL || '',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 2000,
};

// TPMS (Tire Pressure Monitoring System) Configuration
// Note: Endpoint baru tidak memerlukan API_KEY dan SN parameter
export const TPMS_CONFIG = {
  REALTIME_ENDPOINT: import.meta.env.VITE_API_TPMS_REALTIME_ENDPOINT || '',
  LOCATION_ENDPOINT: import.meta.env.VITE_API_TPMS_LOCATION_ENDPOINT || '',
  WS_URL: import.meta.env.VITE_TPMS_WS_URL || '',
  TIMEOUT: 30000,
};

export default {
  TRACKING_CONFIG,
  TPMS_CONFIG,
};
