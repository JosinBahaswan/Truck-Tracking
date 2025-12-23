/**
 * Services - Main Barrel Export
 * Central import point for all backend services
 *
 * Usage Examples:
 * // Import specific modules
 * import { authApi, trucksApi } from 'services';
 * import { tpmsAPI } from 'services';
 *
 * // Import by backend
 * import * as management from 'services/management';
 * import * as tracking from 'services/tracking';
 */

// Backend 2 - Management & Master Data
export * from './management';

// Backend 1 - Tracking & TPMS
export * from './tracking';

// Alert Events API (Backend 1)
export { alertEventsAPI } from './alertEvents.api';

// WebSocket Services
export { FleetWebSocket } from './websocket/FleetWebSocket';
