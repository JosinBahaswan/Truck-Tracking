/**
 * Custom hook for real-time alert notifications
 * Polls active alerts and provides notification state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { alertEventsAPI } from '../services/alertEvents.api';

const POLL_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export const useAlertNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const previousAlertsRef = useRef(new Map());
  const pollingTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const isPollingRef = useRef(false);

  /**
   * Fetch active alerts and detect new ones
   */
  const fetchActiveAlerts = useCallback(async () => {
    // Prevent concurrent calls
    if (isPollingRef.current) {
      console.log('⏭️ Skipping fetch - already in progress');
      return;
    }

    try {
      isPollingRef.current = true;
      console.log('🔔 Fetching active alerts for notifications...');
      const response = await alertEventsAPI.getActiveAlerts();
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      console.log('📥 Alert response:', response);
      
      if (response.success && response.data) {
        const allActiveAlerts = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Active alerts found:', allActiveAlerts.length);
        
        // Sync directly with all active alerts (no time filter, no limit)
        // Sort by newest first
        const activeAlerts = allActiveAlerts
          .sort((a, b) => {
            const timeA = new Date(a.created_at || a.occurredAt);
            const timeB = new Date(b.created_at || b.occurredAt);
            return timeB - timeA;
          });
        
        console.log('📊 Active alerts for notifications:', activeAlerts.length);
        
        // Create new alerts map for current active alerts
        const newAlertsMap = new Map();
        activeAlerts.forEach((alert) => {
          newAlertsMap.set(alert.id, alert);
        });

        // Find NEW alerts (not in previous map)
        const newNotifications = [];
        activeAlerts.forEach((alert) => {
          if (!previousAlertsRef.current.has(alert.id)) {
            console.log('🆕 New alert detected:', alert.id, alert);
            // New alert detected
            newNotifications.push({
              id: alert.id,
              title: getAlertTitle(alert),
              message: alert.message || alert.description || 'Alert triggered',
              time: formatTimeAgo(alert.created_at || alert.occurredAt),
              type: getSeverityType(alert.severity),
              severity: alert.severity,
              truckId: alert.truck_id,
              truckName: alert.truck?.name || alert.truck?.plate_number || `Truck #${alert.truck_id}`,
              isRead: false,
              timestamp: new Date(alert.created_at || alert.occurredAt || Date.now()),
            });
          }
        });

        // Find RESOLVED alerts (in previous map but not in current active alerts)
        const resolvedAlertIds = new Set();
        previousAlertsRef.current.forEach((_, alertId) => {
          if (!newAlertsMap.has(alertId)) {
            resolvedAlertIds.add(alertId);
            console.log('✅ Alert resolved:', alertId);
          }
        });

        // Update previous alerts map
        previousAlertsRef.current = newAlertsMap;

        // Sync notifications with current active alerts (always replace with latest)
        const currentNotifications = activeAlerts.map((alert) => ({
          id: alert.id,
          title: getAlertTitle(alert),
          message: alert.message || alert.description || 'Alert triggered',
          time: formatTimeAgo(alert.created_at || alert.occurredAt),
          type: getSeverityType(alert.severity),
          severity: alert.severity,
          truckId: alert.truck_id,
          truckName: alert.truck?.name || alert.truck?.plate_number || `Truck #${alert.truck_id}`,
          isRead: false,
          timestamp: new Date(alert.created_at || alert.occurredAt || Date.now()),
        }));

        setNotifications(currentNotifications);
        setUnreadCount(currentNotifications.length);
        console.log('📊 Notifications synced:', currentNotifications.length);

        // Show browser notification for new alerts only
        if (newNotifications.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
          newNotifications.forEach((notif) => {
            new Notification(notif.title, {
              body: notif.message,
              icon: '/logo.png',
              tag: `alert-${notif.id}`,
            });
          });
        }
      } else {
        console.warn('⚠️ Invalid alert response format:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching active alerts:', error.message);
      
      // Increment retry count
      retryCountRef.current++;
      
      // If max retries reached, wait longer before next attempt
      if (retryCountRef.current >= MAX_RETRIES) {
        console.warn(`⚠️ Max retries (${MAX_RETRIES}) reached. Waiting ${RETRY_DELAY}ms before next attempt.`);
        // Reset after a delay
        setTimeout(() => {
          retryCountRef.current = 0;
        }, RETRY_DELAY);
      }
      
      // Don't throw error, just log it to allow continuous polling
    } finally {
      setLoading(false);
      isPollingRef.current = false;
    }
  }, []);

  /**
   * Start polling for alerts
   */
  const startPolling = useCallback(() => {
    fetchActiveAlerts();

    const poll = () => {
      // Use longer interval if we've had errors
      const delay = retryCountRef.current >= MAX_RETRIES ? RETRY_DELAY : POLL_INTERVAL;
      
      pollingTimeoutRef.current = setTimeout(() => {
        fetchActiveAlerts();
        poll();
      }, delay);
    };

    poll();
  }, [fetchActiveAlerts]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Mark notification as read (auto-remove)
   */
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) => {
      // Remove the notification when read instead of marking it
      const updated = prev.filter((n) => n.id !== notificationId);
      const unread = updated.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
      console.log('🗑️ Notification removed on read:', notificationId);
      return updated;
    });
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Start polling on mount
  useEffect(() => {
    startPolling();
    requestNotificationPermission();

    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling, requestNotificationPermission]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: fetchActiveAlerts,
  };
};

/**
 * Helper: Get alert title based on alert type
 */
const getAlertTitle = (alert) => {
  const truckName = alert.truck?.name || alert.truck?.plate_number || `Truck #${alert.truck_id}`;
  
  // Get alert type from alert object or alert_code
  let alertType = alert.alert?.name || alert.alert_name || 'Alert';
  
  // If we have alert_code, use more descriptive name
  if (alert.alert_code) {
    switch (alert.alert_code) {
      case 'TIRE_TEMP_CRITICAL':
        alertType = 'Critical Temperature';
        break;
      case 'TIRE_TEMP_HIGH':
        alertType = 'High Temperature';
        break;
      case 'TIRE_PRESSURE_CRITICAL':
        alertType = 'Critical Low Pressure';
        break;
      case 'TIRE_PRESSURE_HIGH':
        alertType = 'Critical High Pressure';
        break;
      default:
        alertType = alert.alert_code.replace(/_/g, ' ');
    }
  }

  return `${truckName} - ${alertType}`;
};

/**
 * Helper: Map severity to notification type
 */
const getSeverityType = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'info';
  }
};

/**
 * Helper: Format timestamp to relative time
 */
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
};

export default useAlertNotifications;
