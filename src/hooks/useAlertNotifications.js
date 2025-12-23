/**
 * Custom hook for real-time alert notifications
 * Polls active alerts and provides notification state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { alertEventsAPI } from '../services/alertEvents.api';

const POLL_INTERVAL = 30000; // 30 seconds
const MAX_NOTIFICATIONS = 10; // Maximum number of notifications to keep

export const useAlertNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const previousAlertsRef = useRef(new Map());
  const pollingTimeoutRef = useRef(null);

  /**
   * Fetch active alerts and detect new ones
   */
  const fetchActiveAlerts = useCallback(async () => {
    try {
      console.log('🔔 Fetching active alerts for notifications...');
      const response = await alertEventsAPI.getActiveAlerts();
      
      console.log('📥 Alert response:', response);
      
      if (response.success && response.data) {
        const activeAlerts = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Active alerts found:', activeAlerts.length);
        const newNotifications = [];

        // Check for new alerts
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

        // Update previous alerts map
        const newAlertsMap = new Map();
        activeAlerts.forEach((alert) => {
          newAlertsMap.set(alert.id, alert);
        });
        previousAlertsRef.current = newAlertsMap;

        // Add new notifications to state (keeping max limit)
        if (newNotifications.length > 0) {
          console.log('🔔 Adding', newNotifications.length, 'new notifications');
          setNotifications((prev) => {
            const updated = [...newNotifications, ...prev].slice(0, MAX_NOTIFICATIONS);
            const unread = updated.filter((n) => !n.isRead).length;
            setUnreadCount(unread);
            console.log('📊 Unread count:', unread);
            return updated;
          });

          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            newNotifications.forEach((notif) => {
              new Notification(notif.title, {
                body: notif.message,
                icon: '/logo.png',
                tag: `alert-${notif.id}`,
              });
            });
          }
        } else {
          console.log('ℹ️ No new alerts detected');
        }
      } else {
        console.warn('⚠️ Invalid alert response format:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching active alerts:', error.message);
      // Don't throw error, just log it to allow continuous polling
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Start polling for alerts
   */
  const startPolling = useCallback(() => {
    fetchActiveAlerts();

    const poll = () => {
      pollingTimeoutRef.current = setTimeout(() => {
        fetchActiveAlerts();
        poll();
      }, POLL_INTERVAL);
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
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      const unread = updated.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
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
  const truckName = alert.truck?.name || `Truck #${alert.truck_id}`;
  const alertType = alert.alert?.name || 'Alert';

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
