/**
 * Backend 1 (BE1) - Tracking & TPMS API
 * Central export point for tracking modules
 *
 * Usage Examples:
 * import { tpmsAPI, trackingAPI } from 'services/tracking';
 * import { FleetWebSocket } from 'services/tracking';
 */

// Configuration
export { TRACKING_CONFIG, TPMS_CONFIG } from './config';

// Tracking API - Live Tracking & History
export { trackingAPI } from './tracking.api';

// TPMS API (will be moved here from api/tpms.api.js)
export { tpmsAPI } from './tpms.api';

// History & Analytics API (NEW)
export { default as historyAPI } from './history.api';

// Monitoring API - Temperature & Tire Pressure Monitoring
export { default as monitoringAPI } from './monitoring.api';
