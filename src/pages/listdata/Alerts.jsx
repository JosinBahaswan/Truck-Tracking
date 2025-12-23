// src/pages/Alerts.jsx
import React, { useEffect, useState, useCallback } from 'react';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { alertEventsAPI } from '../../services/alertEvents.api.js';
import { Button } from '../../components/common/Button.jsx';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '../../components/common/DropdownMenu.jsx';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const pageSize = 20;

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 Loading alerts from Alert Events API...');

      const params = {
        page,
        limit: pageSize,
        sortBy: 'created_at',
        sortOrder: 'desc',
      };

      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;

      const response = await alertEventsAPI.getAlerts(params);
      console.log('✅ Alerts response:', response);

      if (response.success) {
        setAlerts(response.data || []);
        setPagination(response.pagination || null);
      }
    } catch (error) {
      console.error('❌ Failed to load alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus, page]);

  const loadStats = useCallback(async () => {
    try {
      const response = await alertEventsAPI.getAlertStats(7);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    loadStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAlerts();
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAlerts, loadStats]);

  const handleResolveAlert = async (alertId) => {
    if (!window.confirm('Mark this alert as resolved?')) return;

    try {
      await alertEventsAPI.resolveAlert(alertId);
      console.log('✅ Alert resolved successfully');
      loadAlerts();
      loadStats();
    } catch (error) {
      console.error('❌ Failed to resolve alert:', error);
      alert('Failed to resolve alert: ' + error.message);
    }
  };

  const getSeverityColor = (severity) => {
    const sev = String(severity || '').toLowerCase();
    if (sev === 'critical') return 'bg-red-100 text-red-800 border-red-300';
    if (sev === 'warning') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getSeverityIcon = (severity) => {
    const sev = String(severity || '').toLowerCase();
    if (sev === 'critical') return <FireIcon className="h-6 w-6 text-red-500" />;
    if (sev === 'warning') return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    return <ClockIcon className="h-6 w-6 text-blue-500" />;
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alert Events Log</h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time tire pressure & temperature monitoring alerts
              </p>
            </div>
            <button
              onClick={() => {
                loadAlerts();
                loadStats();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.summary.total}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.summary.active}</p>
                  </div>
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Critical</p>
                    <p className="text-2xl font-bold text-red-600">{stats.summary.critical}</p>
                  </div>
                  <FireIcon className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.summary.resolved}</p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    {filterSeverity === 'critical'
                      ? 'Critical'
                      : filterSeverity === 'warning'
                        ? 'Warning'
                        : filterSeverity === 'info'
                          ? 'Info'
                          : 'All Severities'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('');
                      setPage(1);
                    }}
                  >
                    All Severities
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('critical');
                      setPage(1);
                    }}
                  >
                    Critical
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('warning');
                      setPage(1);
                    }}
                  >
                    Warning
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('info');
                      setPage(1);
                    }}
                  >
                    Info
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {filterStatus === 'active'
                      ? 'Active Only'
                      : filterStatus === 'resolved'
                        ? 'Resolved Only'
                        : 'All Status'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterStatus('');
                      setPage(1);
                    }}
                  >
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterStatus('active');
                      setPage(1);
                    }}
                  >
                    Active Only
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterStatus('resolved');
                      setPage(1);
                    }}
                  >
                    Resolved Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
                <span className="ml-3 text-gray-600">Loading alerts...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircleIcon className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500">No alerts found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      alert.status === 'active' ? 'border-l-4 border-l-yellow-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">{getSeverityIcon(alert.severity)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {alert.alert?.name || 'Alert Event'}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Truck:</span>
                            <span>{alert.truck?.name || `#${alert.truck_id}`}</span>
                          </div>
                          {alert.sensor && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Sensor:</span>
                              <span>
                                Tire {alert.sensor.tire_no} ({alert.sensor.sn})
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Value:</span>
                            <span>{alert.value}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span>{formatTimeAgo(alert.created_at)}</span>
                          </div>
                          {alert.status === 'resolved' && alert.resolved_at && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              <span>Resolved {formatTimeAgo(alert.resolved_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {alert.status === 'active' && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm px-6 py-3 flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
                total alerts)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
};

export default Alerts;
