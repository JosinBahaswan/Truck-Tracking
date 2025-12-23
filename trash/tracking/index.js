/**
 * Backend 1 (BE1) - Tracking & TPMS API
 * Central export point for tracking modules
 *
 * Usage Examples:
 * import { tpmsAPI } from 'services/tracking';
 * import { FleetWebSocket } from 'services/tracking';
 */

// Configuration
export { TRACKING_CONFIG, TPMS_CONFIG } from './config';

// TPMS API (will be moved here from api/tpms.api.js)
export { tpmsAPI } from './tpms.api';
