# 🚨 Alert Events API - Frontend Integration Guide

## 📋 Overview

API untuk mengambil data **alert_events** (notifikasi/peringatan) dari sistem TPMS. Alert events mencatat semua kejadian abnormal seperti:
- 🌡️ **Temperature Alert** - Suhu ban terlalu tinggi/rendah
- 💨 **Pressure Alert** - Tekanan ban terlalu tinggi/rendah
- 🔋 **Battery Alert** - Battery sensor lemah
- 📡 **Connection Alert** - Device offline/lost connection

---

## 🔑 Authentication

### Testing Mode (Development)
```env
TESTING_MODE=true  # di .env backend
```
**Tidak perlu JWT token** untuk testing local.

### Production Mode
```javascript
// Header dengan JWT token
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 🚀 API Endpoints

### 1. Get All Alerts (with Pagination & Filter)

**Endpoint:**
```
GET /api/alerts
```

**URL:**
```
http://192.168.21.18:3001/api/alerts
```

**Description:**
Mendapatkan semua alert events dengan pagination dan filter lengkap.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Halaman yang diminta |
| `limit` | number | 20 | Jumlah item per halaman |
| `severity` | string | - | Filter by severity: `critical`, `warning`, `info` |
| `status` | string | - | Filter by status: `active`, `resolved` |
| `truck_id` | number | - | Filter by truck ID |
| `device_id` | number | - | Filter by device ID |
| `sensor_id` | number | - | Filter by sensor ID |
| `date` | string | - | Filter specific day (YYYY-MM-DD) |
| `date_from` | string | - | Start date range (YYYY-MM-DD) |
| `date_to` | string | - | End date range (YYYY-MM-DD) |
| `sortBy` | string | `created_at` | Sort by field |
| `sortOrder` | string | `desc` | Sort order: `asc`, `desc` |

**Example Requests:**

```javascript
// Get all alerts (page 1, default 20 items)
GET /api/alerts

// Get page 2 with 50 items per page
GET /api/alerts?page=2&limit=50

// Get critical alerts only
GET /api/alerts?severity=critical

// Get active alerts for specific truck
GET /api/alerts?status=active&truck_id=1

// Get alerts for specific date
GET /api/alerts?date=2025-12-18

// Get alerts in date range
GET /api/alerts?date_from=2025-12-01&date_to=2025-12-18

// Combined filters
GET /api/alerts?severity=critical&status=active&truck_id=1&page=1&limit=10
```

**Response Success (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "alert_id": 1,
      "device_id": 1,
      "sensor_id": 5,
      "truck_id": 1,
      "value": 95.5,
      "message": "High tire pressure detected on Tire 5",
      "status": "active",
      "created_at": "2025-12-18T10:30:00.000Z",
      "resolved_at": null,
      "alert": {
        "id": 1,
        "code": "HIGH_PRESSURE",
        "name": "High Tire Pressure",
        "description": "Tire pressure exceeds maximum threshold",
        "severity": "critical"
      },
      "truck": {
        "id": 1,
        "name": "Simulator Truck SIM01",
        "plate": "B 9001 SIM",
        "model": "Mitsubishi Fuso"
      },
      "device": {
        "id": 1,
        "sn": "DEV-SIM01"
      },
      "sensor": {
        "id": 5,
        "sn": "SENS-SIM01-T05",
        "tireNo": 5
      }
    }
    // ... more alerts
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

### 2. Get Active Alerts Only

**Endpoint:**
```
GET /api/alerts/active
```

**URL:**
```
http://192.168.21.18:3001/api/alerts/active
```

**Description:**
Mendapatkan semua alert yang masih aktif (belum resolved).

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `severity` | string | Filter by severity: `critical`, `warning`, `info` |
| `truck_id` | number | Filter by truck ID |

**Example Requests:**

```javascript
// Get all active alerts
GET /api/alerts/active

// Get critical active alerts only
GET /api/alerts/active?severity=critical

// Get active alerts for specific truck
GET /api/alerts/active?truck_id=1
```

**Response Success (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "alert_id": 1,
      "device_id": 1,
      "sensor_id": 5,
      "truck_id": 1,
      "value": 95.5,
      "message": "High tire pressure detected on Tire 5",
      "status": "active",
      "created_at": "2025-12-18T10:30:00.000Z",
      "resolved_at": null,
      "alert": {
        "id": 1,
        "code": "HIGH_PRESSURE",
        "name": "High Tire Pressure",
        "description": "Tire pressure exceeds maximum threshold",
        "severity": "critical",
        "threshold_min": null,
        "threshold_max": 110.0
      },
      "truck": {
        "id": 1,
        "name": "Simulator Truck SIM01",
        "plate": "B 9001 SIM",
        "model": "Mitsubishi Fuso"
      },
      "device": {
        "id": 1,
        "sn": "DEV-SIM01"
      },
      "sensor": {
        "id": 5,
        "sn": "SENS-SIM01-T05",
        "tireNo": 5
      }
    }
  ],
  "count": 12
}
```

---

### 3. Get Alert Statistics

**Endpoint:**
```
GET /api/alerts/stats
```

**URL:**
```
http://192.168.21.18:3001/api/alerts/stats
```

**Description:**
Mendapatkan statistik alert untuk dashboard/reporting.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 7 | Periode dalam hari (7, 30, 90, dll) |
| `truck_id` | number | - | Filter by truck ID |

**Example Requests:**

```javascript
// Get stats for last 7 days (default)
GET /api/alerts/stats

// Get stats for last 30 days
GET /api/alerts/stats?days=30

// Get stats for specific truck (last 7 days)
GET /api/alerts/stats?truck_id=1

// Get stats for specific truck (last 30 days)
GET /api/alerts/stats?truck_id=1&days=30
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 156,
      "active": 12,
      "resolved": 144,
      "critical": 8,
      "warning": 4
    },
    "byType": [
      {
        "code": "HIGH_PRESSURE",
        "name": "High Tire Pressure",
        "severity": "critical",
        "count": 45
      },
      {
        "code": "HIGH_TEMP",
        "name": "High Temperature",
        "severity": "critical",
        "count": 38
      },
      {
        "code": "LOW_PRESSURE",
        "name": "Low Tire Pressure",
        "severity": "warning",
        "count": 32
      },
      {
        "code": "LOW_BATTERY",
        "name": "Low Battery",
        "severity": "warning",
        "count": 28
      }
    ],
    "period": {
      "days": 7,
      "startDate": "2025-12-11T10:30:00.000Z",
      "endDate": "2025-12-18T10:30:00.000Z"
    }
  }
}
```

---

### 4. Get Single Alert by ID

**Endpoint:**
```
GET /api/alerts/:id
```

**URL:**
```
http://192.168.21.18:3001/api/alerts/123
```

**Description:**
Mendapatkan detail lengkap satu alert event.

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "alert_id": 1,
    "device_id": 1,
    "sensor_id": 5,
    "truck_id": 1,
    "value": 95.5,
    "message": "High tire pressure detected on Tire 5",
    "status": "active",
    "created_at": "2025-12-18T10:30:00.000Z",
    "resolved_at": null,
    "alert": {
      "id": 1,
      "code": "HIGH_PRESSURE",
      "name": "High Tire Pressure",
      "description": "Tire pressure exceeds maximum threshold",
      "severity": "critical",
      "threshold_min": null,
      "threshold_max": 110.0
    },
    "truck": {
      "id": 1,
      "name": "Simulator Truck SIM01",
      "plate": "B 9001 SIM",
      "model": "Mitsubishi Fuso",
      "vin": "1HGBH41JXMN109186"
    },
    "device": {
      "id": 1,
      "sn": "DEV-SIM01",
      "sim_number": "081234567890"
    },
    "sensor": {
      "id": 5,
      "sn": "SENS-SIM01-T05",
      "tireNo": 5,
      "tempValue": 68.5,
      "tirepValue": 95.5
    }
  }
}
```

**Response Error (404):**

```json
{
  "success": false,
  "message": "Alert not found"
}
```

---

### 5. Resolve Alert

**Endpoint:**
```
PATCH /api/alerts/:id/resolve
```

**URL:**
```
http://192.168.21.18:3001/api/alerts/123/resolve
```

**Description:**
Menandai alert sebagai resolved (sudah ditangani).

**Response Success (200):**

```json
{
  "success": true,
  "message": "Alert resolved successfully",
  "data": {
    "id": 123,
    "status": "resolved",
    "resolved_at": "2025-12-18T10:45:00.000Z"
  }
}
```

---

### 6. Delete Alert

**Endpoint:**
```
DELETE /api/alerts/:id
```

**URL:**
```
http://192.168.21.18:3001/api/alerts/123
```

**Description:**
Menghapus alert event.

**Response Success (200):**

```json
{
  "success": true,
  "message": "Alert deleted successfully"
}
```

---

## 💻 Frontend Implementation

### React + Axios Example

#### 1. Alert Service

```javascript
// src/services/alertService.js
import apiClient from '../api/client';

export const alertService = {
  // Get all alerts with pagination and filters
  getAlerts: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/alerts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  // Get active alerts only
  getActiveAlerts: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/alerts/active', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
  },

  // Get alert statistics
  getAlertStats: async (days = 7, truckId) => {
    try {
      const params = { days };
      if (truckId) params.truck_id = truckId;
      
      const response = await apiClient.get('/api/alerts/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      throw error;
    }
  },

  // Get single alert by ID
  getAlertById: async (id) => {
    try {
      const response = await apiClient.get(`/api/alerts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alert:', error);
      throw error;
    }
  },

  // Resolve alert
  resolveAlert: async (id) => {
    try {
      const response = await apiClient.patch(`/api/alerts/${id}/resolve`);
      return response.data;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  },

  // Delete alert
  deleteAlert: async (id) => {
    try {
      const response = await apiClient.delete(`/api/alerts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  },
};
```

---

#### 2. Alert List Component

```javascript
// src/components/AlertList.jsx
import React, { useState, useEffect } from 'react';
import { alertService } from '../services/alertService';

const AlertList = () => {
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    severity: '',
    status: '',
  });

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertService.getAlerts(filters);
      
      if (response.success) {
        setAlerts(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAlerts();
  }, [filters]);

  // Handle resolve
  const handleResolve = async (alertId) => {
    try {
      const response = await alertService.resolveAlert(alertId);
      
      if (response.success) {
        alert('Alert resolved successfully');
        fetchAlerts(); // Refresh list
      }
    } catch (error) {
      alert('Failed to resolve alert');
    }
  };

  // Severity badge color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="alert-list">
      {/* Filters */}
      <div className="filters">
        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alert List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="alerts">
          {alerts.map((alert) => (
            <div key={alert.id} className="alert-card">
              <div className="alert-header">
                <span className={`severity-badge ${getSeverityColor(alert.alert.severity)}`}>
                  {alert.alert.severity.toUpperCase()}
                </span>
                <span className="status">{alert.status}</span>
              </div>

              <h3>{alert.alert.name}</h3>
              <p>{alert.message}</p>

              <div className="alert-details">
                <span>🚛 {alert.truck?.plate}</span>
                <span>🔧 Tire {alert.sensor?.tireNo}</span>
                <span>📊 Value: {alert.value}</span>
              </div>

              <div className="alert-footer">
                <span>{new Date(alert.created_at).toLocaleString()}</span>
                {alert.status === 'active' && (
                  <button onClick={() => handleResolve(alert.id)}>
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={pagination.page === 1}
          onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
        >
          Previous
        </button>
        
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        
        <button
          disabled={pagination.page === pagination.totalPages}
          onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AlertList;
```

---

#### 3. Alert Stats Dashboard

```javascript
// src/components/AlertStats.jsx
import React, { useState, useEffect } from 'react';
import { alertService } from '../services/alertService';

const AlertStats = ({ truckId, days = 7 }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await alertService.getAlertStats(days, truckId);
        
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [days, truckId]);

  if (loading) return <div>Loading stats...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="alert-stats">
      <h2>Alert Statistics (Last {days} days)</h2>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Alerts</h3>
          <p className="stat-value">{stats.summary.total}</p>
        </div>

        <div className="stat-card critical">
          <h3>Active</h3>
          <p className="stat-value">{stats.summary.active}</p>
        </div>

        <div className="stat-card success">
          <h3>Resolved</h3>
          <p className="stat-value">{stats.summary.resolved}</p>
        </div>

        <div className="stat-card danger">
          <h3>Critical</h3>
          <p className="stat-value">{stats.summary.critical}</p>
        </div>

        <div className="stat-card warning">
          <h3>Warning</h3>
          <p className="stat-value">{stats.summary.warning}</p>
        </div>
      </div>

      {/* Alert Types */}
      <div className="alert-types">
        <h3>Alerts by Type</h3>
        {stats.byType.map((type, index) => (
          <div key={index} className="alert-type-item">
            <div className="type-info">
              <span className={`severity-badge ${type.severity}`}>
                {type.severity}
              </span>
              <span className="type-name">{type.name}</span>
            </div>
            <span className="type-count">{type.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertStats;
```

---

## 🎨 Alert Severity Colors

```css
/* CSS for severity badges */
.severity-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.severity-badge.critical {
  background-color: #dc3545; /* Red */
}

.severity-badge.warning {
  background-color: #ffc107; /* Yellow */
  color: #000;
}

.severity-badge.info {
  background-color: #17a2b8; /* Blue */
}
```

---

## 📊 Alert Data Structure

### alert_events Table Fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Unique alert event ID |
| `alert_id` | int | Reference to alert type |
| `device_id` | int | Device yang trigger alert |
| `sensor_id` | int | Sensor yang trigger alert (untuk tire alerts) |
| `truck_id` | int | Truck yang terkena alert |
| `value` | float | Nilai yang trigger alert (temp/pressure) |
| `message` | string | Pesan detail alert |
| `status` | string | `active` atau `resolved` |
| `created_at` | datetime | Waktu alert terjadi |
| `resolved_at` | datetime | Waktu alert di-resolve (null jika active) |

---

## 🔔 Real-time Alert Updates (WebSocket)

Untuk real-time alerts, gunakan WebSocket:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://192.168.21.18:3001/ws');

// Subscribe to alerts
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'alerts'
}));

// Listen for new alerts
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'new_alerts') {
    // Handle new alerts
    console.log('New alerts:', message.data);
    // Update UI, show notification, etc.
  }
};
```

---

## 🧪 Testing Examples

```bash
# Test dengan cURL

# Get all alerts
curl http://192.168.21.18:3001/api/alerts

# Get active critical alerts
curl "http://192.168.21.18:3001/api/alerts/active?severity=critical"

# Get alert statistics (last 30 days)
curl "http://192.168.21.18:3001/api/alerts/stats?days=30"

# Get single alert
curl http://192.168.21.18:3001/api/alerts/123

# Resolve alert
curl -X PATCH http://192.168.21.18:3001/api/alerts/123/resolve
```

---

## ✅ Best Practices

1. **Polling Interval:**
   - Active alerts: Poll every 30 seconds
   - Alert list: Refresh on demand
   - Stats: Refresh every 5 minutes

2. **Filtering:**
   - Always filter by `status: 'active'` untuk dashboard
   - Use severity filter untuk prioritas
   - Use truck_id filter untuk truck-specific view

3. **Pagination:**
   - Use limit=20 untuk list view
   - Use limit=5 untuk dashboard/widget

4. **Error Handling:**
   - Always handle 404 untuk alert not found
   - Show user-friendly error messages
   - Retry on network errors

---

**Happy Coding! 🚀**
